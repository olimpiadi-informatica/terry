use std::env;

use clap::Parser;
use sqlx::SqlitePool;

mod checker_api;
mod cli;
mod config;
mod contest_manager;
mod database;
mod detect_exe;
mod extractors;
mod handlers;
mod import_task;
mod import_user;
mod models;
mod serve;
mod storage_manager;

use crate::cli::{Cli, Commands};

mod export;

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    color_eyre::install()?;
    dotenvy::dotenv().ok();

    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = SqlitePool::connect(&db_url).await?;
    sqlx::migrate!().run(&pool).await?;

    let cli = Cli::parse();

    match cli.command {
        Commands::Serve(args) => {
            serve::serve(pool, &args).await?;
        }
        Commands::ImportTask(args) => {
            import_task::import_task(&pool, &args).await?;
        }
        Commands::ImportUser(args) => {
            import_user::import_user(&pool, &args).await?;
        }
        Commands::Export(args) => {
            export::export(&pool, &args).await?;
        }
    }

    Ok(())
}
