use std::sync::Arc;

use axum::Json;
use axum::extract::State;
use teloxide::Bot;
use teloxide::payloads::SendMessageSetters;
use teloxide::prelude::Requester;
use teloxide::sugar::request::RequestLinkPreviewExt;
use teloxide::types::{ChatId, ParseMode};
use teloxide::utils::markdown::{bold, code_block, escape, italic};
use tracing::error;

use super::ApiError;
use super::api::CommunicationList;
use crate::database;
use crate::extractors::AuthUser;
use crate::serve::AppState;

pub async fn list(
    State(state): State<AppState>,
    user: Option<AuthUser>,
) -> Result<Json<CommunicationList>, ApiError> {
    let announcements = database::list_announcements(&state.pool).await?;
    let questions = if let Some(u) = user {
        database::get_questions(&state.pool, &u.token).await?
    } else {
        vec![]
    };

    Ok(Json(CommunicationList {
        announcements,
        questions,
    }))
}

// Telegram bot data
pub type TelegramBotData = Option<(Bot, ChatId, String)>;

async fn send_telegram_notification(api: Arc<TelegramBotData>, question: crate::models::Question) {
    if let Some((bot, channel, url)) = api.as_ref() {
        let message = [
            bold("New question"),
            italic(&escape(&format!("At {} UTC", question.date))),
            "\n".to_owned(),
            code_block(&question.content),
            escape(url),
        ]
        .join("\n");

        if let Err(e) = bot
            .send_message(*channel, message)
            .parse_mode(ParseMode::MarkdownV2)
            .disable_link_preview(true)
            .await
        {
            error!("Failed to send telegram message: {:?}", e);
        }
    }
}

pub async fn ask(
    State(state): State<AppState>,
    user: AuthUser,
    question: String,
) -> Result<Json<()>, ApiError> {
    let id = database::add_question(&state.pool, &user.token, &question).await?;
    let q = database::get_question(&state.pool, id)
        .await?
        .expect("Failed to fetch question after creation");

    tokio::spawn(send_telegram_notification(
        state.telegram_bot.clone(),
        q.clone(),
    ));

    Ok(Json(()))
}
