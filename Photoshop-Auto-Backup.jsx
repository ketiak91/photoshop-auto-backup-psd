#target photoshop

/*
    ================================================================
    PHOTOSHOP AUTO BACKUP PSD
    ================================================================

    Automatically saves the active Photoshop document and maintains
    two rotating PSD backups.

    Example:

        Monster.psd
        Monster_bu1_2909.psd
        Monster_bu2_2909.psd

    Workflow:

        Run 1 -> Save original -> Create BU1
        Run 2 -> Save original -> Create BU2
        Run 3 -> Save original -> Replace older backup
        Run 4 -> Save original -> Replace the other backup
        ...and so on.

    IMPORTANT

    Always run this script with the ORIGINAL working document active.

    If the active document is already a BU1 or BU2 backup, the script
    stops and warns you.

    New / Untitled documents:
        The script opens Photoshop's normal Save As dialog first,
        then continues with the backup process.

    No external Photoshop Action (.atn) is required.
*/


// ================================================================
// SETTINGS
// ================================================================

var BACKUP_PREFIX = "_bu";
var BACKUP_EXTENSION = ".psd";


// ================================================================
// MAIN
// ================================================================

function main() {

    // ------------------------------------------------------------
    // 1. CHECK THAT A DOCUMENT IS OPEN
    // ------------------------------------------------------------

    if (app.documents.length === 0) {

        alert(
            "No Photoshop document is open."
        );

        return;
    }


    var original =
        app.activeDocument;


    // ------------------------------------------------------------
    // 2. SAFETY CHECK
    // ------------------------------------------------------------

    if (isBackupFile(original.name)) {

        alert(
            "BACKUP FILE DETECTED\n\n" +

            "You are currently working on:\n" +
            original.name +
            "\n\n" +

            "This script should only be run on the ORIGINAL " +
            "working PSD.\n\n" +

            "Please switch back to the original file and run " +
            "the script again."
        );

        return;
    }


    // ------------------------------------------------------------
    // 3. BACKUP PROCESS
    // ------------------------------------------------------------

    try {

        var isNewDocument = false;


        // --------------------------------------------------------
        // Determine whether this document has been saved before.
        // --------------------------------------------------------

        try {

            var testPath =
                original.fullName;


            if (
                !testPath ||
                !testPath.exists
            ) {

                isNewDocument = true;
            }


        } catch (e) {

            isNewDocument = true;
        }


        // --------------------------------------------------------
        // Save the original document.
        // --------------------------------------------------------

        if (isNewDocument) {

            // First-time save.
            // Photoshop displays its normal Save As dialog.

            saveNewDocument(
                original
            );


            var savedFile =
                getDocumentFile(
                    original
                );


            if (!savedFile) {

                throw new Error(
                    "The document was not saved.\n\n" +
                    "Backup cancelled."
                );
            }


        } else {

            // Existing saved document.
            // Save current work without intentionally opening
            // another Save As dialog.

            saveExistingDocument(
                original
            );


            var savedFile =
                getDocumentFile(
                    original
                );


            if (!savedFile) {

                throw new Error(
                    "Could not determine the saved Photoshop file.\n\n" +
                    "Backup cancelled."
                );
            }
        }


        // --------------------------------------------------------
        // 4. FILE / FOLDER INFORMATION
        // --------------------------------------------------------

        var originalFile =
            savedFile;


        var folder =
            originalFile.parent;


        var originalName =
            originalFile.name;


        // Remove original extension.

        var baseName =
            originalName.replace(
                /\.[^\.]+$/,
                ""
            );


        // --------------------------------------------------------
        // 5. CREATE DDMM DATE CODE
        // --------------------------------------------------------

        var now =
            new Date();


        var day =
            now.getDate();


        var month =
            now.getMonth() + 1;


        var dd =
            (day < 10 ? "0" : "") +
            day;


        var mm =
            (month < 10 ? "0" : "") +
            month;


        var dateCode =
            dd + mm;


        // --------------------------------------------------------
        // 6. FIND EXISTING BU1 / BU2
        // --------------------------------------------------------

        var bu1 =
            findBackup(
                folder,
                baseName,
                1
            );


        var bu2 =
            findBackup(
                folder,
                baseName,
                2
            );


        var backupSlot;


        // --------------------------------------------------------
        // 7. CHOOSE BACKUP SLOT
        // --------------------------------------------------------

        if (!bu1 && !bu2) {

            // No backups yet.

            backupSlot = 1;


        } else if (!bu1) {

            // BU1 does not exist.

            backupSlot = 1;


        } else if (!bu2) {

            // BU2 does not exist.

            backupSlot = 2;


        } else {

            // Both exist.
            // Replace whichever is older.

            if (
                bu1.modified <=
                bu2.modified
            ) {

                backupSlot = 1;

            } else {

                backupSlot = 2;
            }
        }


        // --------------------------------------------------------
        // 8. REMOVE OLD BACKUP IN SELECTED SLOT
        // --------------------------------------------------------

        var oldBackup;


        if (backupSlot === 1) {

            oldBackup = bu1;

        } else {

            oldBackup = bu2;
        }


        if (oldBackup) {

            if (!oldBackup.remove()) {

                throw new Error(
                    "Could not remove old backup:\n\n" +
                    oldBackup.fsName
                );
            }
        }


        // --------------------------------------------------------
        // 9. CREATE BACKUP FILENAME
        // --------------------------------------------------------

        var backupName =
            baseName +
            BACKUP_PREFIX +
            backupSlot +
            "_" +
            dateCode +
            BACKUP_EXTENSION;


        var backupFile =
            new File(
                folder.fsName +
                "/" +
                backupName
            );


        // --------------------------------------------------------
        // 10. DUPLICATE ORIGINAL
        // --------------------------------------------------------

        var backupDoc =
            original.duplicate();


        // --------------------------------------------------------
        // 11. SAVE BACKUP AS PSD
        // --------------------------------------------------------

        var psdOptions =
            new PhotoshopSaveOptions();


        psdOptions.layers =
            true;


        psdOptions.embedColorProfile =
            true;


        psdOptions.annotations =
            true;


        psdOptions.alphaChannels =
            true;


        psdOptions.spotColors =
            true;


        backupDoc.saveAs(
            backupFile,
            psdOptions,
            true,
            Extension.LOWERCASE
        );


        // --------------------------------------------------------
        // 12. CLOSE BACKUP
        // --------------------------------------------------------

        backupDoc.close(
            SaveOptions.DONOTSAVECHANGES
        );


        // --------------------------------------------------------
        // 13. RETURN TO ORIGINAL
        // --------------------------------------------------------

        app.activeDocument =
            original;


    } catch (e) {

        try {

            app.activeDocument =
                original;

        } catch (_) {}


        alert(
            "Backup script failed.\n\n" +
            e.message
        );
    }
}


// ================================================================
// FUNCTION: CHECK IF DOCUMENT IS A BACKUP
// ================================================================
//
// Detects:
//
//     _bu1_DDMM
//     _bu2_DDMM
//
// Example:
//
//     Monster_bu1_2909.psd
//     Monster_bu2_2909.psd
//
// Case-insensitive.
// ================================================================

function isBackupFile(filename) {

    var pattern =
        /_bu[12]_\d{4}(?:\.[^\.]+)?$/i;


    return pattern.test(
        filename
    );
}


// ================================================================
// FUNCTION: FIRST-TIME SAVE
// ================================================================
//
// Photoshop displays its normal Save As dialog.
// ================================================================

function saveNewDocument(doc) {

    var idSave =
        charIDToTypeID("save");


    var desc =
        new ActionDescriptor();


    executeAction(
        idSave,
        desc,
        DialogModes.ALL
    );
}


// ================================================================
// FUNCTION: SAVE EXISTING DOCUMENT
// ================================================================
//
// First attempts Photoshop's native Save command.
//
// If that fails, it falls back to saving directly to the
// document's existing filename.
// ================================================================

function saveExistingDocument(doc) {

    var idSave =
        charIDToTypeID("save");


    var desc =
        new ActionDescriptor();


    try {

        executeAction(
            idSave,
            desc,
            DialogModes.NO
        );


    } catch (e) {

        // --------------------------------------------------------
        // FALLBACK SAVE
        // --------------------------------------------------------

        var currentFile =
            getDocumentFile(
                doc
            );


        if (!currentFile) {

            throw e;
        }


        var psdOptions =
            new PhotoshopSaveOptions();


        psdOptions.layers =
            true;


        psdOptions.embedColorProfile =
            true;


        psdOptions.annotations =
            true;


        psdOptions.alphaChannels =
            true;


        psdOptions.spotColors =
            true;


        doc.saveAs(
            currentFile,
            psdOptions,
            false,
            Extension.LOWERCASE
        );
    }
}


// ================================================================
// FUNCTION: GET DOCUMENT FILE
// ================================================================
//
// Returns the actual file associated with the document.
//
// Returns null if the document has never been saved.
// ================================================================

function getDocumentFile(doc) {

    try {

        var file =
            doc.fullName;


        if (
            file &&
            file.exists
        ) {

            return file;
        }


    } catch (e) {}


    return null;
}


// ================================================================
// FUNCTION: FIND BU1 / BU2
// ================================================================
//
// Searches the folder manually rather than using a getFiles()
// callback.
// ================================================================

function findBackup(
    folder,
    baseName,
    slot
) {

    var files =
        folder.getFiles();


    var pattern =
        new RegExp(
            "^" +
            escapeRegExp(baseName) +
            BACKUP_PREFIX +
            slot +
            "_\\d{4}" +
            escapeRegExp(BACKUP_EXTENSION) +
            "$",
            "i"
        );


    var found =
        null;


    for (
        var i = 0;
        i < files.length;
        i++
    ) {

        var file =
            files[i];


        // Ignore folders.

        if (
            !(file instanceof File)
        ) {

            continue;
        }


        // Check filename.

        if (
            pattern.test(
                file.name
            )
        ) {

            // First matching backup.

            if (
                found === null
            ) {

                found = file;


            // If multiple backups somehow exist for the same
            // slot, use the newest one.

            } else if (
                file.modified >
                found.modified
            ) {

                found = file;
            }
        }
    }


    return found;
}


// ================================================================
// FUNCTION: ESCAPE REGEX CHARACTERS
// ================================================================

function escapeRegExp(string) {

    return string.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


// ================================================================
// START SCRIPT
// ================================================================

main();
