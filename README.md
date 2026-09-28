# Photoshop Auto Backup PSD

A lightweight Adobe Photoshop JSX script that automatically saves your current document and maintains **two rotating PSD backups**.

Designed for artists who want a simple local safety net without installing another application or maintaining a large backup system.

## Features

- Automatically saves the current Photoshop document before creating a backup.
- Works with both existing saved documents and new Untitled documents.
- Uses Photoshop's normal **Save As** dialog when a document has never been saved.
- Maintains exactly **two rotating backups**.
- Automatically replaces the older backup when both slots already exist.
- Keeps backups as layered PSD files.
- Preserves the document's color profile, annotations, alpha channels, spot colors, and layers when creating backups.
- Warns and stops if the active document is already a BU1 or BU2 backup.
- Does not require an external Photoshop Action (`.atn`).
- Uses only Photoshop's built-in ExtendScript/JSX functionality.

## Example

If your working file is:

```text
Monster.psd
```

the script creates:

```text
Monster_bu1_2909.psd
Monster_bu2_2909.psd
```

The backups use the day/month date format:

```text
DDMM
```

For example:

```text
Monster_bu1_2909.psd
```

means backup slot 1 created on September 29.

## How rotation works

The script keeps a maximum of two backup files.

### First run

```text
Monster.psd
Monster_bu1_2909.psd
```

### Second run

```text
Monster.psd
Monster_bu1_2909.psd
Monster_bu2_2909.psd
```

### Third run

The script checks the modification time of BU1 and BU2 and replaces whichever backup is older.

The same process continues on every subsequent run.

This means the folder never accumulates hundreds of backup files.

## Installation

1. Download `Photoshop-Auto-Backup.jsx`.
2. Open Adobe Photoshop.
3. Go to:

   **File → Scripts → Browse...**

4. Select the `.jsx` file.
5. Run it while your **original working document** is active.

You can also place the JSX file in Photoshop's Scripts folder if you want it to appear permanently under:

**File → Scripts**

After installing it there, restart Photoshop.

## Using the script

### Existing document

Open your normal PSD:

```text
Monster.psd
```

Make some changes and run the script.

The script will:

1. Save the current document.
2. Determine which backup slot to use.
3. Remove the older backup if both slots already exist.
4. Duplicate the current document.
5. Save the duplicate as a PSD backup.
6. Close the backup document.
7. Return focus to the original document.

### New / Untitled document

If you start with:

```text
Untitled-1
```

run the script.

Photoshop will open its normal Save As dialog.

After you name and save the document, the script automatically continues and creates the first backup.

You do not need to manually save the document beforehand.

## Important safety feature

The script is designed to be run on the **original working PSD**, not on a backup.

If you accidentally activate:

```text
Monster_bu1_2909.psd
```

or:

```text
Monster_bu2_2909.psd
```

the script stops and displays a warning.

This prevents accidentally creating backups of backups.

## Compatibility

This script is intended for Adobe Photoshop versions that support JSX / ExtendScript.

The development workflow that led to this version involved testing across Photoshop 2018 and Photoshop 2023 environments.

Photoshop installations can behave differently depending on version, configuration, permissions, and file environment. If you encounter a save-related issue, see the troubleshooting section below.

## Troubleshooting

### The script opens Save As every time

Make sure the document is actually saved as a normal Photoshop file and that Photoshop can access its existing location.

If Photoshop cannot resolve the document's existing file path, the script may treat it as an unsaved document.

### "User canceled operation"

This can occur when Photoshop's native save operation fails or is interrupted.

The script attempts a fallback save to the document's existing file path when possible.

If the fallback also fails, check:

- File permissions.
- Whether the file is located on a network/cloud-synced drive.
- Whether another application has locked the file.
- Whether the destination folder is writable.
- Whether the document format is compatible with PSD saving.

### The backup is not created

Check whether Photoshop has permission to write to the document's folder.

Also make sure the original file is not itself named using the backup pattern:

```text
_bu1_DDMM
_bu2_DDMM
```

### Only one backup exists

That is normal after the first run.

The second backup is created on the next run.

## Backup naming

The naming convention is:

```text
ORIGINAL_NAME_buSLOT_DDMM.psd
```

For example:

```text
Character_Final.psd
Character_Final_bu1_2909.psd
Character_Final_bu2_2909.psd
```

## Limitations

This is intentionally a small local backup utility rather than a complete version-control or archival system.

It does **not**:

- Upload backups to the cloud.
- Keep an unlimited history.
- Track changes between versions.
- Restore files automatically.
- Back up multiple Photoshop documents at scheduled intervals.
- Replace a proper project backup strategy.

For important production work, keep a separate backup system as well.

## Why two backups?

Two rotating backups provide a simple compromise:

- The current PSD is your working file.
- BU1 gives you one recent previous state.
- BU2 gives you another previous state.

Older backups are intentionally replaced so the folder does not grow indefinitely.

## Customization

The script has a small settings section near the top:

```jsx
var BACKUP_PREFIX = "_bu";
var BACKUP_EXTENSION = ".psd";
```

The backup count is intentionally fixed at two in the current version because the rotation logic is designed specifically around BU1 and BU2.

If you modify the script, make sure the filename detection, rotation logic, and safety check are updated together.

## Credits

Originally developed as a production workflow utility for **Bad Moon Art Studio**.

## License

MIT License. See [`LICENSE`](LICENSE).

## Disclaimer

Use at your own risk. Always maintain a separate backup strategy for important production files.
