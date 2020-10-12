#[macro_use]
extern crate log;

use actix_web::middleware::Logger;
use actix_web::ResponseError;
use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use telegram_bot::{Api, types::ParseMode, types::requests::SendMessage, types::ChannelId};
use core::fmt::Display;
use failure::Fallible;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use structopt::StructOpt;

mod db;

/// Information about the telegram bot:
///
/// 0. The connected API
/// 1. The ID of the channel where to post the notifications
/// 2. The URL of the communication admin page
type TelegramBotData = Option<(Api, ChannelId, String)>;

/// An error occurred with a request.
#[derive(Debug)]
struct ServiceError(actix_web::Error);

impl From<actix_web::Error> for ServiceError {
    fn from(err: actix_web::Error) -> Self {
        ServiceError(err)
    }
}

impl Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> Result<(), std::fmt::Error> {
        f.write_str(&self.0.to_string())
    }
}

impl ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        // when an error occurs, return it as a 500 ISE, with the json
        // formatted error.
        HttpResponse::InternalServerError().json(self.0.to_string())
    }
}

/// Response body to GET /communications
#[derive(Debug, Serialize)]
struct AnnouncementList {
    /// The list of all the posted announcements.
    announcements: Vec<db::Announcement>,
}

/// Get a list of all the posted announcements, not requiring to be logged in.
#[get("/communications")]
async fn communications(db: web::Data<db::Pool>) -> Result<HttpResponse, ServiceError> {
    let announcements = db::list_announcements(&db).await?;
    Ok(HttpResponse::Ok().json(AnnouncementList { announcements }))
}

// Response body to GET /communications/{token}
#[derive(Debug, Serialize)]
struct CommunicationList {
    /// The list of all the posted announcements.
    announcements: Vec<db::Announcement>,
    /// The list of all the questions posted by the user, or all the questions
    /// if the user is an admin.
    questions: Vec<db::Question>,
}

/// Get a list of all the questions of the user, or all the questions if the
/// user is an admin; get also the list of all the announcements.
#[get("/communications/{token}")]
async fn communications_token(
    db: web::Data<db::Pool>,
    web::Path((token,)): web::Path<(String,)>,
) -> Result<HttpResponse, ServiceError> {
    // execute the two queries in parallel
    let announcements = Box::pin(db::list_announcements(&db));
    let questions = Box::pin(db::questions(&db, token));
    let (announcements, questions) = futures::future::join(announcements, questions).await;
    Ok(HttpResponse::Ok().json(CommunicationList {
        announcements: announcements?,
        questions: questions?,
    }))
}

/// JSON request body for the POST /communications/{token}
#[derive(Debug, Deserialize, Clone)]
pub struct AskQuestion {
    /// Content of the question to post.
    content: String,
}

async fn send_telegram_notification(api: Arc<TelegramBotData>, question: db::Question) {
    if let Some((api, channel, url)) = api.as_ref() {
        let message = format!(
            "*New question*\n_At {} UTC_\n\n```\n{}\n```\n{}",
            question.date, question.content, url
        );
        let mut message =
            SendMessage::new(channel, message);
        message.parse_mode(ParseMode::Markdown);
        message.disable_preview();
        if let Err(e) = api.send(message).await {
            error!("Failed to send telegram message: {:?}", e);
        }
    }
}

/// Post a new question.
#[post("/communications/{token}")]
async fn ask(
    db: web::Data<db::Pool>,
    api: web::Data<TelegramBotData>,
    web::Path((token,)): web::Path<(String,)>,
    question: web::Json<AskQuestion>,
) -> Result<HttpResponse, ServiceError> {
    let q = db::add_question(&db, token, question.0.clone()).await?;
    actix_web::rt::spawn(send_telegram_notification(api.into_inner(), q.clone()));
    Ok(HttpResponse::Created().json(q))
}

/// JSON request body for the POST /communications/{token}/{id}
#[derive(Debug, Deserialize)]
pub struct AnswerQuestion {
    /// Content of the answer to the question.
    content: String,
}

/// Answer a question. The token in the URL is the token of the admin that
/// answers the question. The id is the identifier of the question to answer.
#[post("/communications/{token}/{id}")]
async fn answer(
    db: web::Data<db::Pool>,
    web::Path((token, id)): web::Path<(String, i64)>,
    answer: web::Json<AnswerQuestion>,
) -> Result<HttpResponse, ServiceError> {
    let is_admin = db::is_admin(&db, token.clone()).await?;
    if !is_admin {
        return Ok(HttpResponse::Forbidden().json("You are not an admin"));
    }
    let q = db::answer_question(&db, token, id, answer.0.content).await?;
    Ok(HttpResponse::Created().json(q))
}

/// JSON request body for the POST /communications
#[derive(Debug, Deserialize)]
pub struct AddAnnouncement {
    /// Severity of the announcement (see db.rs)
    severity: String,
    /// The title of the announcement.
    title: String,
    /// The content of the announcement, in Markdown.
    content: String,
    /// The token of the admin that is posting the announcement.
    token: String,
}

/// Publish a new announcement.
#[post("/communications")]
async fn announce(
    db: web::Data<db::Pool>,
    question: web::Json<AddAnnouncement>,
) -> Result<HttpResponse, ServiceError> {
    let is_admin = db::is_admin(&db, question.token.clone()).await?;
    if !is_admin {
        return Ok(HttpResponse::Forbidden().json("You are not an admin"));
    }
    db::add_announcement(&db, question.0).await?;
    Ok(HttpResponse::Created().json("Announcement added"))
}

#[derive(Debug, StructOpt)]
#[structopt(about = "Backend for the communication system of terry.")]
struct Opt {
    /// Location of the database file
    #[structopt(default_value = "db.sqlite3", long, short)]
    database: PathBuf,

    /// Address to bind for the web server
    #[structopt(default_value = "127.0.0.1:1236", long, short)]
    bind: String,

    /// Token of the telegram bot. You have to provide also --admin-url and --channel-id
    #[structopt(long)]
    token: Option<String>,

    /// Address with the list of questions.
    ///
    /// Example: http://terry.online/admin/communication
    #[structopt(long)]
    admin_url: Option<String>,

    /// Channel id of where to send the notifications.
    ///
    /// Example: -1001112223334
    #[structopt(long)]
    channel_id: Option<i64>,
}

#[actix_web::main]
async fn main() -> Fallible<()> {
    let opt = Opt::from_args();
    env_logger::init();

    let pool = db::connect(&opt.database)?;
    let api: TelegramBotData = match opt.token {
        Some(token) => {
            let url = opt.admin_url.expect("Missing --admin-url");
            let channel = opt.channel_id.expect("Missing --channel-id");
            let channel = ChannelId::new(channel);
            eprintln!("Using telegram bot with cannel: {}", channel);
            Some((Api::new(token), channel, url))
        }
        _ => {
            eprintln!("The telegram bot is disabled");
            None
        }
    };

    HttpServer::new(move || {
        App::new()
            .data(pool.clone())
            .data(api.clone())
            .wrap(Logger::default())
            .service(communications)
            .service(communications_token)
            .service(ask)
            .service(answer)
            .service(announce)
    })
    .bind(&opt.bind)?
    .run()
    .await?;
    Ok(())
}
