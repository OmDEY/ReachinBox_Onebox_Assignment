const Imap = require("imap");

/**
 * Creates an IMAP connection using the provided account configuration
 * @param {Object} account - Account configuration object
 * @returns {Imap} IMAP instance
 */
function createImapConnection(account) {
  return new Imap({
    user: account.user,
    password: account.password,
    host: account.host,
    port: account.port,
    tls: account.tls,
    tlsOptions: account.tlsOptions || { rejectUnauthorized: false },
    authTimeout: 30000,
    connTimeout: 30000
  });
}

/**
 * Recursively find folder case-insensitively
 * @param {Object} boxes - IMAP mailbox hierarchy
 * @param {string} name - Folder name to find
 * @returns {string|null} Found folder name or null if not found
 */
function findFolder(boxes, name) {
  for (const key in boxes) {
    const normalizedKey = key.replace(/^INBOX\.?/, '');
    if (normalizedKey.toLowerCase() === name.toLowerCase()) return key;
    if (boxes[key].children) {
      const found = findFolder(boxes[key].children, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Move an email to a specified folder
 * @param {Object} options - Move options
 * @param {string|number} options.seqno - Email sequence number or UID
 * @param {string} options.fromFolder - Source folder (default: 'INBOX')
 * @param {string} options.toFolder - Destination folder
 * @param {string} options.accountId - Account ID for logging
 * @param {Object} options.account - Account configuration
 * @param {boolean} [options.useUid=false] - Whether to use UID for message identification
 * @returns {Promise<void>}
 */
async function moveToFolder({
  seqno,
  fromFolder = 'INBOX',
  toFolder,
  accountId = 'unknown',
  account,
  useUid = false
}) {
  if (!seqno || !toFolder) {
    throw new Error('seqno and toFolder are required');
  }

  return new Promise((resolve, reject) => {
    const imap = createImapConnection(account);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          if (imap && typeof imap.end === 'function') {
            imap.end();
          }
        } catch (err) {
          console.error(`[${accountId}] Error during cleanup:`, err);
        }
      }
    };

    const handleError = (err) => {
      if (resolved) return;
      cleanup();
      reject(err);
    };

    // Set timeout for the entire operation
    const timeout = setTimeout(() => {
      handleError(new Error(`Operation timed out after 60 seconds`));
    }, 60000);

    imap.once('error', (err) => {
      clearTimeout(timeout);
      handleError(new Error(`IMAP Error: ${err.message}`));
    });

    imap.once('end', () => {
      clearTimeout(timeout);
      if (!resolved) {
        handleError(new Error('IMAP connection ended before operation completed'));
      }
    });

    imap.once('ready', () => {
      // Open the source folder
      imap.openBox(fromFolder, false, (err) => {
        if (err) {
          clearTimeout(timeout);
          handleError(new Error(`Failed to open source folder ${fromFolder}: ${err.message}`));
          return;
        }


        // Get all available mailboxes
        imap.getBoxes((err, boxes) => {
          if (err) {
            clearTimeout(timeout);
            handleError(new Error(`Failed to get mailbox list: ${err.message}`));
            return;
          }


          // Find the target folder (case-insensitive)
          const existingFolder = findFolder(boxes, toFolder);

          const doMove = (folder) => {
            const move = useUid ? imap.uidMove : imap.move;
            const moveArgs = useUid ? [seqno, folder] : [seqno.toString(), folder];
            
            move.apply(imap, [
              ...moveArgs,
              (err) => {
                clearTimeout(timeout);
                if (err) {
                  handleError(new Error(`Failed to move message: ${err.message}`));
                  return;
                }
                console.log(`[${accountId}] 📦 Moved email #${seqno} from ${fromFolder} to ${folder}`);
                resolved = true;
                imap.end();
                resolve();
              }
            ]);
          };

          if (existingFolder) {
            doMove(existingFolder);
          } else {
            // Create the folder if it doesn't exist
            imap.addBox(toFolder, (err) => {
              if (err && !err.message.includes("conflicts with existing folder")) {
                clearTimeout(timeout);
                handleError(new Error(`Failed to create folder ${toFolder}: ${err.message}`));
                return;
              }
              // Try to find the folder again after creation attempt
              imap.getBoxes((err, newBoxes) => {
                if (err) {
                  clearTimeout(timeout);
                  handleError(new Error(`Failed to verify folder creation: ${err.message}`));
                  return;
                }
                const createdFolder = findFolder(newBoxes, toFolder);
                if (!createdFolder) {
                  clearTimeout(timeout);
                  handleError(new Error(`Failed to locate folder ${toFolder} after creation attempt`));
                  return;
                }
                doMove(createdFolder);
              });
            });
          }
        });
      });
    });

    // Start the connection
    imap.connect();
  });
}

/**
 * Copy an email to a specified folder
 * @param {Object} options - Copy options
 * @param {string|number} options.seqno - Email sequence number or UID
 * @param {string} options.fromFolder - Source folder (default: 'INBOX')
 * @param {string} options.toFolder - Destination folder
 * @param {string} options.accountId - Account ID for logging
 * @param {Object} options.account - Account configuration
 * @param {boolean} [options.useUid=false] - Whether to use UID for message identification
 * @returns {Promise<void>}
 */
async function copyToFolder({
  seqno,
  fromFolder = 'INBOX',
  toFolder,
  accountId = 'unknown',
  account,
  useUid = false
}) {
  if (!seqno || !toFolder) {
    throw new Error('seqno and toFolder are required');
  }

  return new Promise((resolve, reject) => {
    const imap = createImapConnection(account);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          if (imap && typeof imap.end === 'function') {
            imap.end();
          }
        } catch (err) {
          console.error(`[${accountId}] Error during cleanup:`, err);
        }
      }
    };

    const handleError = (err) => {
      if (resolved) return;
      cleanup();
      reject(err);
    };

    // Set timeout for the entire operation
    const timeout = setTimeout(() => {
      handleError(new Error(`Operation timed out after 60 seconds`));
    }, 60000);

    imap.once('error', (err) => {
      clearTimeout(timeout);
      handleError(new Error(`IMAP Error: ${err.message}`));
    });

    imap.once('end', () => {
      clearTimeout(timeout);
      if (!resolved) {
        handleError(new Error('IMAP connection ended before operation completed'));
      }
    });

    imap.once('ready', () => {
      // Open the source folder
      imap.openBox(fromFolder, false, (err) => {
        if (err) {
          clearTimeout(timeout);
          handleError(new Error(`Failed to open source folder ${fromFolder}: ${err.message}`));
          return;
        }


        // Get all available mailboxes
        imap.getBoxes((err, boxes) => {
          if (err) {
            clearTimeout(timeout);
            handleError(new Error(`Failed to get mailbox list: ${err.message}`));
            return;
          }


          // Find the target folder (case-insensitive)
          const existingFolder = findFolder(boxes, toFolder);

          const doCopy = (folder) => {
            const copy = useUid ? imap.uidCopy : imap.copy;
            const copyArgs = useUid ? [seqno, folder] : [seqno.toString(), folder];
            
            copy.apply(imap, [
              ...copyArgs,
              (err) => {
                clearTimeout(timeout);
                if (err) {
                  handleError(new Error(`Failed to copy message: ${err.message}`));
                  return;
                }
                console.log(`[${accountId}] 📋 Copied email #${seqno} from ${fromFolder} to ${folder}`);
                resolved = true;
                imap.end();
                resolve();
              }
            ]);
          };

          if (existingFolder) {
            doCopy(existingFolder);
          } else {
            // Create the folder if it doesn't exist
            imap.addBox(toFolder, (err) => {
              if (err && !err.message.includes("conflicts with existing folder")) {
                clearTimeout(timeout);
                handleError(new Error(`Failed to create folder ${toFolder}: ${err.message}`));
                return;
              }
              // Try to find the folder again after creation attempt
              imap.getBoxes((err, newBoxes) => {
                if (err) {
                  clearTimeout(timeout);
                  handleError(new Error(`Failed to verify folder creation: ${err.message}`));
                  return;
                }
                const createdFolder = findFolder(newBoxes, toFolder);
                if (!createdFolder) {
                  clearTimeout(timeout);
                  handleError(new Error(`Failed to locate folder ${toFolder} after creation attempt`));
                  return;
                }
                doCopy(createdFolder);
              });
            });
          }
        });
      });
    });

    // Start the connection
    imap.connect();
  });
}

module.exports = {
  moveToFolder,
  copyToFolder
};