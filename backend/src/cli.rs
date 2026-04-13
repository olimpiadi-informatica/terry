use std::net::SocketAddr;
use std::path::PathBuf;

use clap::{ArgGroup, Args, Parser, Subcommand};

use crate::models::Role;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Debug, Args)]
#[command(group(
    ArgGroup::new("user_source")
        .required(true)
        .args(["csv", "token"]),
))]
pub struct ImportUserArgs {
    /// Path to a CSV file with `token,name,surname[,role]` columns
    #[arg(long, value_name = "FILE", conflicts_with_all = ["token", "name", "surname"])]
    pub csv: Option<PathBuf>,
    /// The token of the user to import
    #[clap(long, required_unless_present = "csv")]
    pub token: Option<String>,
    /// The name of the user
    #[clap(long, required_unless_present = "csv")]
    pub name: Option<String>,
    /// The surname of the user
    #[clap(long, required_unless_present = "csv")]
    pub surname: Option<String>,
    /// Role of the new user, or default role for CSV rows without a role column
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
    /// Skip exporting submissions with a score less than or equal to zero
    #[arg(long)]
    pub filter_zero_score: bool,
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
