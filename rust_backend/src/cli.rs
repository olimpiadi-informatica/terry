use std::net::SocketAddr;
use std::path::PathBuf;

use clap::{Args, Parser, Subcommand};

use crate::models::Role;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Parser, Debug)]
pub struct ImportUserArgs {
    /// The token of the user to import
    #[clap(long)]
    pub token: String,
    /// The name of the user
    #[clap(long)]
    pub name: String,
    /// The surname of the user
    #[clap(long)]
    pub surname: String,
    /// Role of the new user
    #[clap(long, value_enum, default_value_t = Role::Contestant)]
    pub role: Role,
}

#[derive(Debug, Subcommand)]
pub enum Commands {
    /// Run the server
    Serve(ServeArgs),
    /// Import a task
    ImportTask(ImportTaskArgs),
    /// Import a user
    ImportUser(ImportUserArgs),
    /// Export all submissions
    Export(ExportArgs),
}

#[derive(Debug, Args)]
pub struct ExportArgs {
    /// The directory where to export the submissions
    #[arg(required = true)]
    pub export_dir: PathBuf,
}

#[derive(Debug, Args)]
pub struct ServeArgs {
    /// Path to the configuration file
    #[arg(short, long, value_name = "FILE", default_value = "config.toml")]
    pub config: PathBuf,

    /// The listen address for the server (e.g., 127.0.0.1:9000)
    #[arg(short, long, default_value = "127.0.0.1:9000")]
    pub listen: SocketAddr,
}

#[derive(Debug, Args)]
pub struct ImportTaskArgs {
    /// Path to the task folder
    #[arg(required = true)]
    pub task_folder: PathBuf,
    /// The position of the task
    #[arg(required = true)]
    pub num: i64,
}
