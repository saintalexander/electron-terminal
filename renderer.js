const { ipcRenderer } = require('electron');
var $ = require('jquery');
require('jquery.terminal')($);

class Directory {
    constructor(name, isVisible = true) {
        this.name = name;
        this.isVisible = isVisible;
        this.contents = {};
    }

    addFile(file) {
        this.contents[file.name] = file;
    }

    addDirectory(directory) {
        this.contents[directory.name] = directory;
    }

    listContents() {
        return Object.keys(this.contents)
            .filter(key => this.contents[key].isVisible)
            .join('\n');
    }
}

class File {
    constructor(name, content, isVisible = true) {
        this.name = name;
        this.content = content;
        this.isVisible = isVisible;
    }

    read() {
        return this.content;
    }
}

class UnlockableFile extends File {
    constructor(name, content, password, hints, isVisible = true) {
        super(name, content, isVisible);
        this.password = password;
        this.hints = hints;
        this.hintIndex = 0;
        this.unlocked = false;
    }

    unlock(password) {
        if (password === this.password) {
            this.unlocked = true;
            this.isVisible = true;
            return true;
        }
        return false;
    }

    getHint() {
        return this.hints[this.hintIndex] ? this.hints[this.hintIndex++] : 'No more hints available.';
    }
}

class FileSystem {
    constructor() {
        this.root = new Directory('root');
        this.currentDirectory = this.root;
        this.pathStack = [];
        this.setupDefaultFileSystem();
    }

    setupDefaultFileSystem() {
        const archives = new Directory('archives');
        const research = new Directory('research');
        const communications = new Directory('communications');
        const hidden = new Directory('hidden', false);

        archives.addFile(new File('history.txt', 'Detailed history document contents...'));
        research.addFile(new File('project_overview.txt', 'Overview of the Echoes Project...'));
        communications.addFile(new File('email_001.txt', 'Discussion on ethical implications...'));
        communications.addFile(new UnlockableFile('locked_file.txt', "This file is encrypted. Use 'decode locked_file.txt' to access.", 'correcthorsebatterystaple', ['First hint: Think simple.', 'Second hint: It’s a common meme.', 'Final hint: correcthorsebatterystaple']));
        hidden.addFile(new File('secret_communication.txt', 'Now visible after decoding!'));

        this.root.addDirectory(archives);
        this.root.addDirectory(research);
        this.root.addDirectory(communications);
        this.root.addDirectory(hidden);
    }

    changeDirectory(directoryName) {
        if (directoryName === '..') {
            if (this.pathStack.length === 0) {
                return "Already at root directory";
            }
            this.currentDirectory = this.pathStack.pop();
            return "Returned to root";
        } else if (this.currentDirectory.contents.hasOwnProperty(directoryName)) {
            this.pathStack.push(this.currentDirectory);
            this.currentDirectory = this.currentDirectory.contents[directoryName];
            return `Entered directory: ${directoryName}`;
        } else {
            return 'Directory not found or not a directory';
        }
    }

    listCurrentDirectory() {
        return this.currentDirectory.listContents();
    }

    readFile(fileName) {
        const file = this.currentDirectory.contents[fileName];
        if (!file) {
            return 'No such file or is a directory';
        }
        if (file instanceof UnlockableFile && !file.unlocked) {
            return 'This file is locked. Use decode command to unlock it.';
        }
        return file.read();
    }

    decodeFile(fileName, password) {
        const file = this.currentDirectory.contents[fileName];
        if (file && file instanceof UnlockableFile) {
            if (file.unlock(password)) {
                return "File unlocked successfully!";
            } else {
                return "Incorrect password. Try again.";
            }
        }
        return "File does not exist or is not unlockable.";
    }

    getHint(fileName) {
        const file = this.currentDirectory.contents[fileName];
        if (file && file instanceof UnlockableFile) {
            return file.getHint();
        }
        return "No such file or file is not unlockable.";
    }
}

const fileSystem = new FileSystem();

$('#terminal').terminal(function(command) {
    const typeEcho = (message, options = {}) => {
        this.echo(message, {...options, typing: true, delay: 50});
    };

    let trimmedCommand = command.trim();
    let cmdArgs = trimmedCommand.split(' ').filter(Boolean);

    if (trimmedCommand === 'exit') {
        ipcRenderer.send('terminal', { method: 'exit', args: [] });
    } else if (cmdArgs[0] === 'ls') {
        typeEcho(fileSystem.listCurrentDirectory());
    } else if (cmdArgs[0] === 'cd') {
        if (cmdArgs.length > 1) {
            typeEcho(fileSystem.changeDirectory(cmdArgs[1]));
        } else {
            typeEcho('Specify a directory');
        }
    } else if (cmdArgs[0] === 'cat') {
        if (cmdArgs.length > 1) {
            typeEcho(fileSystem.readFile(cmdArgs[1]));
        } else {
            typeEcho('Specify a file');
        }
    } else if (cmdArgs[0] === 'decode') {
        if (cmdArgs.length > 1) {
            this.push(function(command) {
                if (command === 'hint') {
                    typeEcho(fileSystem.getHint(cmdArgs[1]));
                } else if (fileSystem.decodeFile(cmdArgs[1], command)) {
                    typeEcho(`File '${cmdArgs[1]}' successfully decoded.`);
                    this.pop();  // Exit the nested prompt after successful decoding
                } else {
                    typeEcho('Incorrect password. Try again or type "hint" for a hint.');
                }
            }, {
                prompt: 'Password or hint: '
            });
        } else {
            typeEcho('Specify a file to decode');
        }
    } else if (cmdArgs[0] === 'help') {
        typeEcho('Available commands:\n' +
                  '  help         - Display this help text\n' +
                  '  exit         - Close the terminal\n' +
                  '  ls           - List directory contents\n' +
                  '  cd [dir]     - Change directory. Use ".." to go back to the parent directory.\n' +
                  '  cat [file]   - Display file contents\n' +
                  '  decode [file] - Decode a locked file');
    } else {
        this.error('Unknown command: ' + trimmedCommand, {typing: true, delay: 50});
    }
}, {
    exit: false,
    greetings: function(callback) {
        var version = 'v. ' + process.versions.electron;
        var re = new RegExp('.{' + version.length + '}$');
        var ascii_art = [
            'eeeeeeeee.eeeeee.eeeeeee..eee......eee.eee.eeeeeee...eeeeee..',
            '@@@@@@@@@:@@@@@@:@@@@@@@@:@@@@::::@@@@:@@@:@@@@@@@@:@@@@@@@@:',
            '---%%%----%%%----%%%--%%%-%%%%%--%%%%%-%%%-%%%--%%%-%%%--%%%-',
            '+++&&&++++&&&&&++&&&&&&&++&&&&&&&&&&&&+&&&+&&&++&&&+&&&&&&&&+',
            '***|||****|||||**||||||***|||*||||*|||*|||*|||**|||*||||||||*',
            '===!!!====!!!====!!!=!!!==!!!==!!==!!!=!!!=!!!==!!!=!!!==!!!=',
            '###:::####::::::#:::##:::#:::######:::#:::#:::##:::#:::##:::#',
            '@@@...@@@@......@...@@...@...@@@@@@...@...@...@@...@...@@...@',
            '                                                             '.replace(re, '') + version,
        ].join('\n');        
        var signature = [];
        if (this.cols() >= 61) {
            signature.push(ascii_art);
            signature.push('');
        } else {
            signature.push('Terminal');
        }
        if (this.cols() >= 57) {
            signature.push('Copyright (C) 2024 EOTD <http://jcubic.pl/me>');
        } else if (this.cols() >= 47) {
            signature.push('(C) 2024 EOTD <http://jcubic.pl/me>');
        } else if (this.cols() >= 25) {
            signature.push('(C) 2018 EOTD');
        } else if (this.cols() >= 15) {
            signature.push('(C) 2018 EOTD');
        }
        callback(signature.join('\n') + '\n');
    },
    name: 'electron',
    prompt: '[[;#D72424;]$]> '
});
