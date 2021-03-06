//User Interface for The Resistance Manager. Acts as the presentation layer.
"use strict";
var readlineSync = require('readline-sync'); //for easier repeated prompts
var fs = require('file-system');
var resistance_model_1 = require("./resistance-model");
var resistance_manager_1 = require("./resistance-manager");
/**
 * Function to run the UI
 */
function start() {
    //make a manager and start interacting with it
    var rm = new resistance_model_1.ResistanceModel();
    showMainMenu(rm, new resistance_manager_1.ResistanceManager(rm));
}
exports.start = start;
/**
 * The main menu. Will show until the user exits
 */
function showMainMenu(rm, rmgr) {
    while (true) {
        console.log("Welcome to the Resistance! Pick an option:\n  1. Register a new member\n  2. Register a new protest\n  3. Register a new movement\n  4. Add a member to a protest\n  5. Modify a protest\n  6. Add a protest to a movement\n  7. List protest members\n  8. List members near a protest\n  9. List protests near a location\n  10. Load in existing resistance data\n  11. Exit");
        var response = readlineSync.question('> ');
        if (response === '11' || response.slice(0, 2).toLowerCase() === ':q') {
            var saveWork = readlineSync.question('Do you want to save the data? (y/n): ');
            if (saveWork.toLowerCase().startsWith('y')) {
                var DEFAULT_NAME = 'data.json';
                var fileName = readlineSync.question("Please provide the file name (default: " + DEFAULT_NAME + "): "); //use default if undefined
                if (fileName) {
                    rm.saveResistanceData(fileName + '.json');
                }
                else {
                    rm.saveResistanceData(DEFAULT_NAME);
                }
            }
            break; //stop looping, thus leaving method
        }
        switch (response) {
            case '1':
                showNewMemberMenu(rm, rmgr);
                break;
            case '2':
                showNewProtestMenu(rm, rmgr);
                break;
            case '3':
                showNewMovementMenu(rm, rmgr);
                break;
            case '4':
                showAddToProtestMenu(rm);
                break;
            case '5':
                showModifyProtestMenu(rm);
                break;
            case '6':
                showAddToMovementMenu(rm);
                break;
            case '7':
                showListProtestersMenu(rm);
                break;
            case '8':
                showListNearbyMembersMenu(rm);
                break;
            case '9':
                showListNearbyProtestsMenu(rm);
                break;
            case '10':
                showLoadExistingResistanceDataMenu(rm);
                break;
            //case 11 handled above
            default: console.log('Invalid option!');
        }
        console.log(''); //extra empty line for revisiting
    }
}
/**
 * Show menu to add a new member
 */
function showNewMemberMenu(rm, rmgr) {
    console.log('Add a new member.');
    var name = readlineSync.question('  Name: ');
    var email = readlineSync.question('  Email: ');
    var zip = readlineSync.question('  Zip Code: ');
    if (rmgr.addMember(name, email, zip)) {
        console.log('  Protester added!');
    }
    else {
        console.log('  An input has failed data validation. Please check your input.');
    }
}
/**
 * Show menu to add a new protest. Will then show menu to add members to the protest
 */
function showNewProtestMenu(rm, rmgr) {
    console.log('Add a new protest.');
    var newProtestName = readlineSync.question('  Title of protest: ');
    var zipcode = readlineSync.question('  Location (zip code): ');
    var date = readlineSync.question('  Date and time (ex: Jan 21 2017 13:00 PST): ');
    var protestName = rmgr.addProtest(newProtestName, zipcode, date);
    if (protestName) {
        console.log("  Protest added!");
        showAddToProtestMenu(rm, protestName); //add users to new protest
    }
    else {
        console.log('  An input has failed data validation. Please check your input.');
    }
}
/**
 * Show menu to add a new movement. Will then show menu to add protests to the movement
 */
function showNewMovementMenu(rm, rmgr) {
    console.log('Add a new movement.');
    var newMovementName = readlineSync.question('  Title of movement: ');
    var movementName = rmgr.addMovement(newMovementName);
    if (movementName) {
        console.log("  Movement added!");
        var adding = readlineSync.question('Add protests to movement? (y/n): ');
        while (adding.toLowerCase().startsWith('y')) {
            showAddToMovementMenu(rm, movementName); //add protests to new movement
            adding = readlineSync.question('Add another protest? (y/n): ');
        }
    }
    else {
        console.log('  An input has failed data validation. Please check your input.');
    }
}
/**
 * Show menu to add a member to a protest. Will repeat to add multiple members. Will show menu to search for a protest if none is provided.
 */
function showAddToProtestMenu(rm, protestName) {
    if (!protestName) {
        protestName = showSearchProtestsMenu(rm);
        if (!protestName) {
            return;
        } //if didn't select a protest
    }
    var adding = readlineSync.question('Add a member to protest? (y/n): ');
    while (adding.toLowerCase().startsWith('y')) {
        var memberName = showSearchMembersMenu(rm); //find a member
        if (memberName) {
            rm.addMemberToProtest(memberName, protestName);
        }
        else {
            console.log('No member selected.');
        }
        adding = readlineSync.question('Add another member? (y/n): ');
    }
}
/**
 * Show menu to look up a member. Will return undefined if no member selected.
 */
function showSearchMembersMenu(rm) {
    return _searchListMenu('member', function (q) { return rm.findMemberNames(q); });
}
/**
 * Show menu to look up a protest. Will return undefined if no protest selected.
 */
function showSearchProtestsMenu(rm) {
    return _searchListMenu('protest', function (q) { return rm.findProtestNames(q); });
}
/**
 * Show menu to look up a movement. Will return undefined if no movement selected.
 */
function showSearchMovementsMenu(rm) {
    return _searchListMenu('movement', function (q) { return rm.findMovementNames(q); });
}
/**
 * Helper function that shows a menu to search a list of items and choose a result.
 * Will return undefined if no item is selected
 */
function _searchListMenu(type, searchCallback) {
    console.log("Searching for a " + type + ".");
    var query = readlineSync.question('Search query: ');
    var results = searchCallback(query);
    if (results.length > 0) {
        console.log('Results found: ');
        var resultsDisplay = '  ' + (results.map(function (item, idx) { return idx + 1 + ". " + item; }).join('\n  '));
        console.log(resultsDisplay);
        var choiceIdx = parseInt(readlineSync.question("Choose a " + type + " (1-" + results.length + "): ")); //will covert to number or NaN
        return results[choiceIdx - 1]; //will return undefined if invalid index
    }
    else {
        console.log('No results found.');
        return undefined;
    }
}
/**
 * Show menu to modify protest (title, time, or movement). Will show menu to search for a protest if none is provided.
 */
function showModifyProtestMenu(rm, protestName) {
    if (!protestName) {
        protestName = showSearchProtestsMenu(rm);
        if (!protestName) {
            return;
        } //if didn't select a protest
    }
    while (true) {
        console.log("Edit protest '" + protestName + "'.\n  1. Change title\n  2. Change time\n  3. Add to movement\n  4. Return to previous menu");
        var response = parseInt(readlineSync.question('> '));
        if (response == 1) {
            var newTitle = readlineSync.question('  New title: ');
            rm.modifyProtest(protestName, newTitle);
        }
        else if (response == 2) {
            var newTime = readlineSync.question('  New date and time (ex: Jan 21 2017 13:00 PST): ');
            rm.modifyProtest(protestName, undefined, newTime); //no name to change
        }
        else if (response == 3) {
            showAddToMovementMenu(rm, undefined, protestName);
        }
        else if (response == 4) {
            break; //exit from loop to return
        }
        else {
            console.log('Invalid option!');
        }
    }
}
/**
 * Show menu to add a protest to a movement. Will show menus to search for a protest and a movement if either is not provided.
 */
function showAddToMovementMenu(rm, movementName, protestName) {
    if (!protestName) {
        protestName = showSearchProtestsMenu(rm);
        if (!protestName) {
            return;
        } //if didn't select a protest
    }
    if (!movementName) {
        movementName = showSearchMovementsMenu(rm);
        if (!movementName) {
            return;
        } //if didn't select a movement
    }
    //add the protest to the movement
    rm.addProtestToMovement(protestName, movementName);
}
/**
 * Show a list of members participating in a protest. Will show menu to search for a protest. Should include outputting member's email addresses.
 */
function showListProtestersMenu(rm) {
    var protestName = showSearchProtestsMenu(rm);
    var members = rm.getProtesters(protestName);
    console.log('Members participating in this action:');
    console.log('  ' + members.join('\n  ') + '\n');
    readlineSync.keyInPause('(Press any letter to continue)', { guide: false }); //so have time to read stuff
}
/**
 * Show a list of members geographically near to a protest. Will show menu to search for a protest. Should include outputting member's email addresses.
 */
function showListNearbyMembersMenu(rm) {
    var protestName = showSearchProtestsMenu(rm);
    var DEFAULT_DISTANCE = 20;
    var distance = parseInt(readlineSync.question("Distance in miles from protest (default: " + DEFAULT_DISTANCE + "): ")) | DEFAULT_DISTANCE; //use default if undefined
    var members = rm.getUsersNearProtest(protestName, distance);
    console.log('Members participating in this action:');
    console.log('  ' + members.join('\n  ') + '\n');
    readlineSync.keyInPause('(Press any letter to continue)', { guide: false }); //so have time to read stuff
}
/**
 * Show a list of protests geographically near the given zip code. Displayed protests should list any movements they are a part of.
 */
function showListNearbyProtestsMenu(rm) {
    var zip = readlineSync.question('Zip code to search near: ');
    var DEFAULT_DISTANCE = 50;
    var distance = parseInt(readlineSync.question("Distance in miles from protest (default: " + DEFAULT_DISTANCE + "): ")) | DEFAULT_DISTANCE; //use default if undefined
    var protests = rm.getNearbyProtests(zip, distance);
    console.log('Nearby protests:');
    console.log('  ' + protests.join('\n  ') + '\n');
    readlineSync.keyInPause('(Press any letter to continue)', { guide: false }); //so have time to read stuff
}
/**
 * Loads existing resistance data
 */
function showLoadExistingResistanceDataMenu(rm) {
    var fileName = readlineSync.question('  File Name: ');
    console.log('  Reading in ' + fileName + '.json...');
    var data = fs.readFileSync(fileName + '.json');
    rm.processResistanceData(data.toString());
    readlineSync.keyInPause('(Press any letter to continue)', { guide: false }); //so have time to read stuff
}
