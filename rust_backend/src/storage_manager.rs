use std::io;
use std::path::{Path, PathBuf};

use color_eyre::eyre::{Result, eyre};
use once_cell::sync::Lazy;
use regex::Regex;
use tokio::fs;

use crate::config;

const MAX_LENGTH: usize = 100;

/// Get the relative path to the source file with the specified filename
pub fn new_source_file(source_id: &str, filename: &str) -> Result<PathBuf> {
    let sanitized_filename = sanitize(filename)?;
    let mut path = PathBuf::from("source");
    path.push(&source_id[0..2]);
    path.push(&source_id[2..4]);
    path.push(source_id);
    path.push(sanitized_filename);
    Ok(path)
}

/// Get the relative path to the output file with the specified filename
pub fn new_output_file(output_id: &str, filename: &str) -> Result<PathBuf> {
    let sanitized_filename = sanitize(filename)?;
    let mut path = PathBuf::from("output");
    path.push(&output_id[0..2]);
    path.push(&output_id[2..4]);
    path.push(output_id);
    path.push(sanitized_filename);
    Ok(path)
}

/// Get the relative path to the input file for the specified attempt on the specified task
pub async fn new_input_file(input_id: &str, task_name: &str, attempt: u32) -> io::Result<PathBuf> {
    let filename = format!("{}_input_{}.txt", task_name, attempt);
    let mut path = PathBuf::from("input");
    path.push(&input_id[0..2]);
    path.push(&input_id[2..4]);
    path.push(input_id);
    path.push(filename);
    create_dir(&get_absolute_path(&path)).await?;
    Ok(path)
}

/// Get the size of the filename in bytes
pub async fn get_file_size(relative_path: &Path) -> io::Result<u64> {
    let absolute_path = get_absolute_path(relative_path);
    let metadata = fs::metadata(absolute_path).await?;
    Ok(metadata.len())
}

/// Store a file in the filesystem, creates the directories needed
pub async fn save_file(relative_path: &Path, file_content: &[u8]) -> io::Result<()> {
    let absolute_path = get_absolute_path(relative_path);
    create_dir(&absolute_path).await?;
    fs::write(absolute_path, file_content).await
}

/// Moves a file in the filesystem, creates the directories needed
pub async fn rename_file(src_path: &Path, dst_path: &Path) -> io::Result<()> {
    let src_abs = get_absolute_path(src_path);
    let dst_abs = get_absolute_path(dst_path);
    create_dir(&dst_abs).await?;
    fs::rename(src_abs, dst_abs).await
}

/// Get the absolute path of a stored file
pub fn get_absolute_path(relative_path: &Path) -> PathBuf {
    if relative_path.is_absolute() {
        return relative_path.to_path_buf();
    }
    Path::new(config::STORE_DIR).join(relative_path)
}

/// Create a directory in the filesystem
async fn create_dir(filename: &Path) -> io::Result<()> {
    if let Some(dirname) = filename.parent() {
        fs::create_dir_all(dirname).await
    } else {
        Ok(())
    }
}

/// Sanitize a filename.
fn sanitize(filename: &str) -> Result<String> {
    static RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[^-a-zA-Z0-9_.]").unwrap());
    let filename = RE
        .replace_all(&filename.trim().replace(' ', "_"), "")
        .to_string();

    if filename.is_empty() || filename == "." || filename == ".." {
        return Err(eyre!("Invalid file name"));
    }

    let path = Path::new(&filename);
    let name = path
        .file_stem()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default();
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default();

    if ext.len() > MAX_LENGTH - 1 {
        return Ok(filename.chars().take(MAX_LENGTH).collect());
    }

    let name_len = std::cmp::min(
        name.len(),
        MAX_LENGTH - ext.len() - if ext.is_empty() { 0 } else { 1 },
    );
    let name = &name[0..name_len];

    if ext.is_empty() {
        Ok(name.to_string())
    } else {
        Ok(format!("{}.{}", name, ext))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize() {
        assert_eq!(sanitize("  file name.txt  ").unwrap(), "file_name.txt");
        assert_eq!(sanitize("file/name!@#$.txt").unwrap(), "filename.txt");
        assert_eq!(sanitize("a..b").unwrap(), "a..b");
        assert!(sanitize("").is_err());
        assert!(sanitize(".").is_err());
        assert!(sanitize("..").is_err());
        assert!(sanitize("  ").is_err());

        let long_name = "a".repeat(120);
        assert_eq!(sanitize(&long_name).unwrap().len(), MAX_LENGTH);

        let long_name_ext = format!("{}.txt", "a".repeat(120));
        let sanitized = sanitize(&long_name_ext).unwrap();
        assert_eq!(sanitized.len(), MAX_LENGTH);
        assert!(sanitized.ends_with(".txt"));
        assert_eq!(&sanitized[..95], &"a".repeat(95));
    }

    #[test]
    fn test_path_generation() {
        let source_path = new_source_file("12345678", "file.txt").unwrap();
        assert_eq!(source_path, PathBuf::from("source/12/34/12345678/file.txt"));

        let output_path = new_output_file("abcdefgh", "another file.zip").unwrap();
        assert_eq!(
            output_path,
            PathBuf::from("output/ab/cd/abcdefgh/another_file.zip")
        );
    }
}
