use bitflags::bitflags;

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct ExeFlags: u32 {
        const NONE      = 0x0000;
        const LINUX     = 0x0001;
        const WINDOWS   = 0x0002;
        const MACOS     = 0x0004;
        const MACOS_FAT = 0x0008;
        const BITS_32   = 0x0010;
        const BITS_64   = 0x0020;
    }
}

// Keep signatures sorted by size (longer ones first) to ensure correct matching.
const EXE_SIGNATURES: &[(&[u8], ExeFlags)] = &[
    // 5-byte signatures
    (
        b"\x7F\x45\x4C\x46\x01",
        ExeFlags::LINUX.union(ExeFlags::BITS_32),
    ),
    (
        b"\x7F\x45\x4C\x46\x02",
        ExeFlags::LINUX.union(ExeFlags::BITS_64),
    ),
    // 4-byte signatures
    (
        b"\xCE\xFA\xED\xFE",
        ExeFlags::MACOS.union(ExeFlags::BITS_32),
    ),
    (
        b"\xCF\xFA\xED\xFE",
        ExeFlags::MACOS.union(ExeFlags::BITS_64),
    ),
    (
        b"\xBE\xBA\xFE\xCA",
        ExeFlags::MACOS
            .union(ExeFlags::BITS_32)
            .union(ExeFlags::MACOS_FAT),
    ),
    (
        b"\xBF\xBA\xFE\xCA",
        ExeFlags::MACOS
            .union(ExeFlags::BITS_64)
            .union(ExeFlags::MACOS_FAT),
    ),
    // 2-byte signature
    (b"\x4D\x5A", ExeFlags::WINDOWS),
];

#[allow(dead_code)]
pub fn get_exeflags(content: &[u8]) -> ExeFlags {
    for (sig, flags) in EXE_SIGNATURES {
        if content.starts_with(sig) {
            return *flags;
        }
    }
    ExeFlags::NONE
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linux_64() {
        let content = b"\x7F\x45\x4C\x46\x02\x01\x01\x00";
        assert_eq!(get_exeflags(content), ExeFlags::LINUX | ExeFlags::BITS_64);
    }

    #[test]
    fn test_linux_32() {
        let content = b"\x7F\x45\x4C\x46\x01\x01\x01\x00";
        assert_eq!(get_exeflags(content), ExeFlags::LINUX | ExeFlags::BITS_32);
    }

    #[test]
    fn test_windows() {
        let content = b"\x4D\x5A\x90\x00";
        assert_eq!(get_exeflags(content), ExeFlags::WINDOWS);
    }

    #[test]
    fn test_macos_64() {
        let content = b"\xCF\xFA\xED\xFE\x07\x00\x00\x01";
        assert_eq!(get_exeflags(content), ExeFlags::MACOS | ExeFlags::BITS_64);
    }

    #[test]
    fn test_macos_32() {
        let content = b"\xCE\xFA\xED\xFE\x07\x00\x00\x00";
        assert_eq!(get_exeflags(content), ExeFlags::MACOS | ExeFlags::BITS_32);
    }

    #[test]
    fn test_macos_fat_64() {
        let content = b"\xBF\xBA\xFE\xCA";
        assert_eq!(
            get_exeflags(content),
            ExeFlags::MACOS | ExeFlags::BITS_64 | ExeFlags::MACOS_FAT
        );
    }

    #[test]
    fn test_macos_fat_32() {
        let content = b"\xBE\xBA\xFE\xCA";
        assert_eq!(
            get_exeflags(content),
            ExeFlags::MACOS | ExeFlags::BITS_32 | ExeFlags::MACOS_FAT
        );
    }

    #[test]
    fn test_none() {
        let content = b"this is not an executable";
        assert_eq!(get_exeflags(content), ExeFlags::NONE);
    }

    #[test]
    fn test_empty() {
        let content = b"";
        assert_eq!(get_exeflags(content), ExeFlags::NONE);
    }
}
