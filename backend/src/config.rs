use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use chrono::{DateTime, Utc};
use color_eyre::eyre::Result;
use serde::Deserialize;

// Hardcoded paths
pub const STORE_DIR: &str = "./files/";
pub const CONTEST_PATH: &str = "./contest/";
pub const TEMPORARY_PATH: &str = "./temp/";

fn default_queue_size() -> usize {
    64
}

#[derive(Deserialize, Debug, Clone)]
pub struct ExtraMaterialSectionConfig {
    pub name: String,
    pub url: String,
    pub page: PathBuf,
}

#[derive(Deserialize, Debug, Clone)]
pub struct ProxySectionConfig {
    pub path: String,
    pub upstream: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Config {
    /// The size of the input queue for each task.
    #[serde(default = "default_queue_size")]
    pub queue_size: usize,

    /// Secret for signing JWT tokens.
    pub jwt_secret: String,

    /// The name of the cookie used for JWT tokens.
    pub jwt_cookie_name: String,

    /// The URL of the SSO provider. If not present, SSO is disabled.
    pub sso_url: Option<String>,

    /// Number of workers for the input generation pool. Defaults to the number of logical CPUs.s.
    pub num_workers: Option<usize>,

    // --- Contest settings ---
    /// The name of the contest.
    pub contest_name: String,

    /// A description of the contest.
    pub contest_description: Option<PathBuf>,

    /// The total duration of the contest. (e.g., "1h 30m", "5400s")
    #[serde(with = "humantime_serde")]
    pub contest_duration: Duration,

    /// If present, enables USACO-style contest mode.
    #[serde(default)]
    #[serde(with = "humantime_serde::option")]
    pub window_duration: Option<Duration>,

    /// The start time of the contest.
    pub start_time: DateTime<Utc>,

    /// Path to a markdown file for public description, available before login.
    pub public_description: Option<PathBuf>,

    /// A list of extra material sections.
    #[serde(default)]
    pub extra_material: Vec<ExtraMaterialSectionConfig>,

    /// A list of proxy sections.
    #[serde(default)]
    pub proxy: Vec<ProxySectionConfig>,

    // --- Telegram settings ---
    pub telegram_bot_token: Option<String>,
    pub telegram_channel_id: Option<i64>,
    pub telegram_admin_url: Option<String>,
}

pub fn load_config<P: AsRef<Path>>(path: P) -> Result<Config> {
    let content = fs::read_to_string(path)?;
    let config: Config = toml::from_str(&content)?;
    Ok(config)
}

#[cfg(test)]
mod tests {
    use tempfile::NamedTempFile;

    use super::*;

    #[tokio::test]
    async fn test_class_method_generation() {
        let config_content = r#"
            contest_name = "My Test Contest"
            jwt_secret = "some_secret"
            jwt_cookie_name = "terry_jwt"
            contest_duration = "1h"
            start_time = "2025-01-01T00:00:00Z"
            admin_token = "admin_secret"
        "#;
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        fs::write(temp_file.path(), config_content).expect("Failed to write config content");

        let config_path = PathBuf::from(temp_file.path());
        let loaded_config = load_config(&config_path).expect("Failed to load config");

        assert_eq!(loaded_config.contest_name, "My Test Contest");
    }

    #[tokio::test]
    async fn test_file_not_found() {
        let config_path = PathBuf::from("/this/file/doesnt/exist");
        let result = load_config(&config_path);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_empty_config() {
        let config_content = "";
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        fs::write(temp_file.path(), config_content).expect("Failed to write config content");

        let config_path = PathBuf::from(temp_file.path());
        let result = load_config(&config_path);
        assert!(result.is_err()); // Empty config is invalid because of missing required fields
    }

    #[tokio::test]
    async fn test_invalid_yaml() {
        let config_content = "[42"; // Invalid TOML
        let temp_file = NamedTempFile::new().expect("Failed to create temp file");
        fs::write(temp_file.path(), config_content).expect("Failed to write config content");

        let config_path = PathBuf::from(temp_file.path());
        let result = load_config(&config_path);
        assert!(result.is_err());
    }
}
