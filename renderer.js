/**
 * Example usage of jQuery Terminal in Electron app
 * Copyright (c) 2018 Jakub Jankewicz <http://jcubic.pl/me>
 * Released under MIT license
 */
/* global require, module */

const {ipcRenderer} = require('electron');

require('devtron').install();

var $ = require('jquery');
require('jquery.terminal')($);

$('#terminal').terminal(function(command) {
    const typeEcho = (message, options = {}) => {
        this.echo(message, {...options, typing: true, delay: 50}); // Ensure typewriter effect is applied
    };

    if (command.match(/^\s*exit\*$/)) {
        ipcRenderer.send('terminal', {
            method: 'exit',
            args: []
        });
    } else if (command.trim() === 'hello') {
        typeEcho('Hello, World!');
    } else if (command.trim() === 'help') {
        typeEcho('Available commands:\n' +
                  '  hello        - Display "Hello, World!"\n' +
                  '  help         - Display this help text\n' +
                  '  exit         - Close the terminal\n' +
                  '  [JS code]    - Evaluate JavaScript code');
    } else if (command.trim() === 'demo') {
        typeEcho('Running demo...');
        // Execute some predefined actions here.
        typeEcho('Demo completed!');
    } else if (command !== '') {
        try {
            var result = window.eval(command);
            if (result !== undefined) {
                typeEcho(new String(result));
            }
        } catch(e) {
            this.error('Error: ' + new String(e), {typing: true, delay: 50}); // Applying typewriter effect to error messages as well
        }
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
        var cols = this.cols();
        var signature = [];
        if (cols >= 61) {
            signature.push(ascii_art);
            signature.push('');
        } else {
            signature.push('Terminal');
        }
        if (cols >= 57) {
            signature.push('Copyright (C) 2024 EOTD <http://jcubic.pl/me>');
        } else if (cols >= 47) {
            signature.push('(C) 2024 EOTD <http://jcubic.pl/me>');
        } else if (cols >= 25) {
            signature.push('(C) 2018 EOTD');
        } else if (cols >= 15) {
            signature.push('(C) 2018 EOTD');
        }
        callback(signature.join('\n') + '\n');
    },
    name: 'electron',
    prompt: '[[;#D72424;]$]> '
});

module.exports = $;
