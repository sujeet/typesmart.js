TypeSmart = {};

TypeSmart.smartDoubleQuote = function () {
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
    return true;
};

TypeSmart.smartSingleQuote = function () {
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
    return true;
};

TypeSmart.smartQuoteTextReplace = function (text) {
    // Strategy :
    // 1) First replace all quotes following whitespace into opening ones.
    // 2) Then all those which are after any character into closing ones.
    // 3) Then remaining into opening ones.
    //
    // Example : (curley quotes are denoted by [ and ])
    //    "He went home and called his mom. 'go home, don't stay' said mom."
    // 1) "He went home and called his mom. ‘go home, don't stay' said mom."
    //                                      ^
    // 2) "He went home and called his mom. ‘go home, don’t stay’ said mom.”
    //                                                   ^      ^          ^
    // 2) “He went home and called his mom. ‘go home, don’t stay’ said mom.”
    //    ^
    return text.replace(/(\s)'/g, "$1\u2018") // Opening singles
               .replace(/(\s)"/g, "$1\u201c") // Opening doubles
                                              // After one or more whitespace.
        .replace(/(.)'/g, "$1\u2019")  // Closing singles
        .replace(/(.)"/g, "$1\u201d") // Closing doubles
        .replace(/'/g, "\u2018")  // Opening singles
        .replace(/"/g, "\u201c"); // Opening doubles
};

// format -> {
//     'classname' : {
//         'string to trigger func1' : func1,
//         'string to trigger func2' : func2,
//     },
//     'classname2' : {
//         'string to trigger func3' : func3,
//     }
// };
TypeSmart.default_custom_triggers = {
    'typeSmartTypography' : {
        '"' : TypeSmart.smartDoubleQuote,
        "'" : TypeSmart.smartSingleQuote,
        "\\random" : (function () {Cursor.new().insert("COMMAND ACTIVATED");})
    }
};

// format -> {
//     'classname' : {
//         'string to be replaced' : 'replace with this one',
//         'str2'                  : 'str3'
//     },
//     'classname2' : {
//         'another str to be replaced' : 'another replacement'
//     }
// };
TypeSmart.default_replacements = {
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

// format -> {
//     'classname' : {
//         'description of func1' : func1, // accepts and returns a string
//         'description of func2' : func2
//     },
//     'classname2' : {
//         'description of func3' : func3
//     }
// };
TypeSmart.default_paste_modifiers = {
    'typeSmartTypography' : {
        'replace single and double dumb quotes with smart ones' :
        TypeSmart.smartQuoteTextReplace
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
TypeSmart.mergeDicts = function (dict1, dict2) {
    var result = {};
    for (key in dict1) { result [key] = dict1 [key];}
    for (key in dict2) {
        if ((key in result) &&
            (typeof (result [key]) == 'object') &&
            (typeof (dict2 [key]) == 'object')) {
            result [key] = TypeSmart.mergeDicts (result [key], dict2 [key]);
        }
        else {
            result [key] = dict2 [key];
        }
    }
    return result;
};

// Convert patterns like
// replacements = {
//     '123' : "one-two-three",
//     '[wow]' : '<exclamation>'
//     '\spellcheck' : spellcheck_func
// }
// 
// To replacement functions like
// functions_from_patterns = {
//     '3' : funcOneTwoThree,
//     ']' : exclamationFunc
//     'k' : spellcheck_func_modified
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
TypeSmart.makeReplacementFunctions = function (replacements) {
    var replacement_functions = {};
    for (replacement_string in replacements) {
        var trigger = replacement_string [replacement_string.length - 1];
        var prefix_to_match = replacement_string.substring (
            0,
            replacement_string.length - 1
        );
        
        var func_to_trigger = (
            function (prefix_to_match, replacement_string, replacements) {
                return function () {
                    var cursor = Cursor.new ();
                    var prefix = cursor.getText (- prefix_to_match.length, 0);
                    if (prefix == prefix_to_match) {
                        cursor.deleteBackward (prefix.length);

                        // Check if we need to insert a string
                        // or call a function.
                        if (typeof replacements [replacement_string]
                            == 'string') {
                            cursor.insert (replacements [replacement_string]);
                            return false;
                        }
                        else if (typeof replacements [replacement_string]
                                 == 'function') {
                            return replacements [replacement_string] ();
                        }
                        else {
                            return true;
                        }
                    }
                    else return true;
                };
            }
        )(prefix_to_match, replacement_string, replacements);

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
};

Array.prototype.contains = function (element) {
    for (var i = 0; i < this.length; i++) {
        if (this [i] == element) return true;
    }
    return false;
};

// dict = {
//     "key1" : {
//         "foo" : bar,
//         "blah" : bleh
//     },
//     "key2" : {
//         1 : 2,
//         3 : 4
//     },
//     5 : {
//         9 : "nine",
//         "88" : 99
//     }
// };
// whiteList = ["key1", 5, something_else];
// unifyWithKeyWhitelist (dict, whiteList)
// returns -> {
//     'foo' : bar,
//     'blah': bleh,
//      9    : "nine",
//     "88"  : 99
// }
TypeSmart.unifyWithKeyWhitelist = function (object, whiteList) {
    var final_object = {};
    for (key in object) {
        if (whiteList.contains (key)) {
            final_object = TypeSmart.mergeDicts (final_object, object [key]);
        }
    }
    return final_object;
};

TypeSmart.getPasteHandler = function (class_list) {
    // Merge user-defined replacement patterns
    // and replacement-functions with the default ones.
    if (typeof TypeSmart.my_replacements == "undefined") {
        TypeSmart.my_replacements = {};
    }
    if (typeof TypeSmart.my_paste_modifiers == "undefined") {
        TypeSmart.my_paste_modifiers = {};
    }

    // replacement function directly from the text patterns.
    var replacements = TypeSmart.unifyWithKeyWhitelist (
        TypeSmart.mergeDicts (
            TypeSmart.my_replacements,
            TypeSmart.default_replacements
        ),
        class_list
    );
    var direct_replacements_func = (function (replacements) {

        return function (text) {
            for (to_be_replaced in replacements) {
                text = text.split (to_be_replaced)
                           .join (replacements [to_be_replaced]);
            }
            return text;
        };

    })(replacements);

    // replacement function combining pre-defined replacement functions
    var paste_modifiers = TypeSmart.unifyWithKeyWhitelist (
        TypeSmart.mergeDicts (
            TypeSmart.my_paste_modifiers,
            TypeSmart.default_paste_modifiers
        ),
        class_list
    );
    
    var combined_from_pre_defined =  direct_replacements_func;
    for (discription in paste_modifiers) {
        var next_func = paste_modifiers [discription];
        combined_from_pre_defined = (
            function (func1, func2){
                return function (text) {
                    return func1 (func2 (text));
                };
            }
        )(combined_from_pre_defined, next_func);
    }
    
    var handler = (
        function (replacement_func) {
            return function (event) {
                var pasted_text = event.clipboardData.getData ('text/plain');
                Cursor.new ().insert (replacement_func (pasted_text));
                return false;
            };
        }
    )(combined_from_pre_defined);
    return handler;
};

// Create and return a function which should be triggered on a keypress
TypeSmart.getKeypressHandler = function (class_list) {
    
    // Merge user-defined replacement patterns
    // and letter-trigger-handlers with the default ones.
    if (typeof TypeSmart.my_replacements == "undefined") {
        TypeSmart.my_replacements = {};
    }
    if (typeof TypeSmart.my_custom_triggers == "undefined") {
        TypeSmart.my_custom_triggers = {};
    }
    var replacements = TypeSmart.mergeDicts (
        TypeSmart.my_replacements,
        TypeSmart.default_replacements
    );
    var custom_triggers = TypeSmart.mergeDicts (
        TypeSmart.my_custom_triggers,
        TypeSmart.default_custom_triggers
    );
    
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
    var final_replacements = TypeSmart.unifyWithKeyWhitelist (
        replacements,
        class_list
    );
    
    // Similarly, strip the classnames from the relpacement functions.
    // The resultant replacement_functions will be of the form
    // replacement_functions = {
    //     'string to trigger the function' : function_to_be_executed,
    //     'another string' : another_func
    // };
    // This means when 'another string' is typed,
    // another_func () will be called.
    var replacement_functions = TypeSmart.unifyWithKeyWhitelist (
        custom_triggers,
        class_list
    );
    
    replacement_functions = TypeSmart.mergeDicts (
        // Convert patterns to functions
        TypeSmart.makeReplacementFunctions (replacement_functions),
        TypeSmart.makeReplacementFunctions (final_replacements)
    );

    var getChar = function (event) {
        if (event.which!=0 && event.charCode!=0) {
            return String.fromCharCode(event.which);
        }
        else {
            return null; // special key
        }
    };

    var handler = (
        function (replacement_functions, getChar) {
            return function (event) {
                var character = getChar (event || window.event);
                if (!character) return true; // special key
                else if (character in replacement_functions) {
                    return replacement_functions [character] ();
                }
                else return true;
            };
        }
    )(replacement_functions, getChar);
    
    return handler;
};

TypeSmart.attachHandlers = function (element) {
    var class_list = element.className.split (/\s+/);
    element.onkeypress = TypeSmart.getKeypressHandler (class_list);
    element.onpaste = TypeSmart.getPasteHandler (class_list);
};
  
TypeSmart.init = function () {
    // Load libcursor
    var libcursor = document.createElement ("script");
    libcursor.setAttribute ('type', 'text/javascript');
    libcursor.setAttribute (
        'src',
        '//sujeetgholap.github.io/libcursor/libcursor.js'
    );
    document.head.appendChild (libcursor);

    // Attach keypress handlers to textareas and contenteditables.
    var attachableElements = document.getElementsByClassName ('typeSmart');
    for (var i = 0; i < attachableElements.length; i++) {
        TypeSmart.attachHandlers (attachableElements [i]);
    }
};
