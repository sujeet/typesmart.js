function smartDoubleQuote () {
    var cursor = Cursor.new ();
    
    // If the previous character is a whitespace,
    // insert opening quote, else insert cloning quote.
    if (/^\s*$/.test (cursor.getText (-1, 0))) {
        cursor.insert ("“");
        return false;
    }
    else {
        cursor.insert ("”");
        return false;
    }
}

function smartSingleQuote () {
    var cursor = Cursor.new ();

    // If the previous character is a whitespace,
    // insert opening quote, else insert cloning quote.
    if (/^\s*$/.test (cursor.getText (-1, 0))) {
        cursor.insert ("‘");
        return false;
    }
    else {
        cursor.insert ("’");
        return false;
    }
}

var default_custom_triggers = {
    'typeSmartSmartQuotes' : {
        '"' : smartDoubleQuote,
        "'" : smartSingleQuote
    }
};

var default_replacements = {

    'typeSmartEmoticons' : {
        ":)" : "😊",
        ":-)": "😊",
        ":(" : "😞",
        ":-(": "😞",
        "<3" : "♥"
    },

    'typeSmartTypography' : {
        "...": "…",
        "--" : "—"
    }
};

// Merges two dicts and returns the result dict
// SHALLOW COPY
// mergeDicts(
//     {
//         1: 2,
//         2: 4,
//         3: {"foo": "bar"}
//     },
//     {
//         9: 3,
//         64: 8,
//         3: {"blah": "bleh"}
//     }
// );
// -> {
//     1: 2,
//     2: 4,
//     9: 3,
//     64: 8,
//     3: {
//         "foo": "bar",
//         "blah": "bleh"
//     }
// };
function mergeDicts (dict1, dict2) {
    var result = {};
    for (key in dict1) { result [key] = dict1 [key];}
    for (key in dict2) {
        if ((key in result) &&
            (typeof (result [key]) == 'object') &&
            (typeof (dict2 [key]) == 'object')) {
            result [key] = mergeDicts (result [key], dict2 [key]);
        }
        else {
            result [key] = dict2 [key];
        }
    }
    return result;
}

function makeReplacementFunctions (replacements) {
    var replacement_functions = {};
    for (replacement_string in replacements) {
        var trigger = replacement_string [replacement_string.length - 1];
        var prefix_to_match = replacement_string.substring (
            0,
            replacement_string.length - 1
        );
        
        var func_to_trigger = (
            function (prefix_to_match, replacement_string) {
                return function () {
                    var cursor = Cursor.new ();
                    var prefix = cursor.getText (- prefix_to_match.length, 0);
                    if (prefix == prefix_to_match) {
                        cursor.deleteBackward (prefix.length)
                            .insert (replacements [replacement_string]);
                        return false;
                    }
                    else return true;
                };
            }
        )(prefix_to_match, replacement_string);

        // One trigger might fire more than one functions
        // For example "(" needs to fire functions for ":(" and ":-("
        var final_func_to_trigger = func_to_trigger;
        if (trigger in replacement_functions) {
            var old_func = replacement_functions [trigger];
            final_func_to_trigger = (
                function (old_func, func_to_trigger) {
                    return function () {
                        // If the function is applicable,
                        // that is, if it finds a replacement and replaces
                        // at the cursor, it returns false
                        
                        // So, call one function and if it fails, call another
                        // and return.
                        var retval = old_func ();
                        if (retval == false /*succeeded*/)
                            return false; /*even this should succeed*/
                        else
                            return func_to_trigger ();
                    };
                }
            )(old_func, func_to_trigger);
        }
        replacement_functions [trigger] = final_func_to_trigger;
    }
    return replacement_functions;
}

TypeSmart = {};
TypeSmart.attachKeypressHandler = function (element) {
    
    // Merge user-defined replacement patterns
    // and letter-trigger-handlers with the default ones.
    if (typeof my_replacements == "undefined") {
        var my_replacements = {};
    }
    if (typeof my_custom_triggers == "undefined") {
        var my_custom_triggers = {};
    }
    var replacements = mergeDicts (my_replacements, default_replacements);
    var custom_triggers = mergeDicts (my_custom_triggers,
                                      default_custom_triggers);
    
    // Strip the class names away
    // Say, replacement is as following.
    // replacements = {
    //     "classname" : {
    //         "str-to-replace" : "string-to-be-inserted"
    //     },
    //     "anotherClassname" : {
    //         "str1" : "result1",
    //         "str2" : "result2"
    //     },
    //     "thirdName" : {
    //         "anotherpattern" : "whatever"
    //     }
    // };
    // for 
    // <element class="classname anotherClassname"></element>
    // final_replacements after stripping the classnames would be:
    // final_replacements = {
    //     "str-to-replace" : "string-to-be-inserted",
    //     "str1" : "result1",
    //     "str2" : "result2"
    // };
    // As element is not of class "thirdName", its patterns are dropped.
    var final_replacements = {};
    for (control_class_name in replacements) {
        if (element.classList.contains (control_class_name)) {
            for (str_to_replace in replacements [control_class_name]) {
                final_replacements [str_to_replace] =
                    replacements [control_class_name] [str_to_replace];
            }
        }
    }
    
    // Similarly, strip the classnames from the relpacement functions.
    // The resultant replacement_functions will be of the form
    // replacement_functions = {
    //     '<character-which-triggers-function>' : function_to_be_executed,
    //     '<another_char>' : another_func
    // };
    // This means when <another_char> character is typed,
    // another_func () will be called.
    var replacement_functions = {};
    for (control_class_name in custom_triggers) {
        if (element.classList.contains (control_class_name)) {
            for (char_trigger in custom_triggers [control_class_name]) {
                replacement_functions [char_trigger] =
                    custom_triggers [control_class_name] [char_trigger];
            }
        }
    }
        
    // Now, convert patterns like
    // replacements = {
    //     '123' : "one-two-three",
    //     '[wow]' : '<exclamation>'
    // }
    // 
    // To replacement functions like
    // functions_from_patterns = {
    //     '3' : funcOneTwoThree,
    //     ']' : exclamationFunc
    // }
    // 
    // Where funcOneTwoThree() will be called whenever 3 is pressed.
    // when called, funcOneTwoThree will check whether the string "12"
    // is right before the cursor, and if it is, it should insert
    // delete that "12" and insert "one-two-three" instead.
    // 
    // NOTE: These function, on a successful insertion, return false
    //       indicating that the insersion has been taken care of
    //       and the default response to keypress should not be executed.
    replacement_functions = mergeDicts (
        replacement_functions,

        // makeReplacementFunctions
        // converts replacement pairs like
        // '123' : 'one-two-three' to trigger-char and func pairs like
        // '3' : funcOneTwoThree
        makeReplacementFunctions (final_replacements)
    );

    var handler = function (event) {
        var character = getChar (event || window.event);
        if (!character) return true; // special key
        else if (character in replacement_functions) {
            return replacement_functions [character] ();
        }
        else return true;
    };
        
    element.onkeypress = handler;
};

TypeSmart.init = function () {
    var attachableElements = document.getElementsByClassName ('typeSmart');
    for (var i = 0; i < attachableElements.length; i++) {
        TypeSmart.attachKeypressHandler (attachableElements [i]);
    }
};
