
function smartDoubleQuote(){var cursor=Cursor.new();if(/^\s*$/.test(cursor.getText(-1,0))){cursor.insert("“");return false;}
else{cursor.insert("”");return false;}}
function smartSingleQuote(){var cursor=Cursor.new();if(/^\s*$/.test(cursor.getText(-1,0))){cursor.insert("‘");return false;}
else{cursor.insert("’");return false;}}
var default_custom_triggers={'typeSmartSmartQuotes':{'"':smartDoubleQuote,"'":smartSingleQuote}};var default_replacements={'typeSmartEmoticons':{":)":"😊",":-)":"😊",":(":"😞",":-(":"😞","<3":"♥"},'typeSmartTypography':{"...":"…","--":"—"}};function mergeDicts(dict1,dict2){var result={};for(key in dict1){result[key]=dict1[key];}
for(key in dict2){if((key in result)&&(typeof(result[key])=='object')&&(typeof(dict2[key])=='object')){result[key]=mergeDicts(result[key],dict2[key]);}
else{result[key]=dict2[key];}}
return result;}
function makeReplacementFunctions(replacements){var replacement_functions={};for(replacement_string in replacements){var trigger=replacement_string[replacement_string.length-1];var prefix_to_match=replacement_string.substring(0,replacement_string.length-1);var func_to_trigger=(function(prefix_to_match,replacement_string){return function(){var cursor=Cursor.new();var prefix=cursor.getText(-prefix_to_match.length,0);if(prefix==prefix_to_match){cursor.deleteBackward(prefix.length).insert(replacements[replacement_string]);return false;}
else return true;};})(prefix_to_match,replacement_string);var final_func_to_trigger=func_to_trigger;if(trigger in replacement_functions){var old_func=replacement_functions[trigger];final_func_to_trigger=(function(old_func,func_to_trigger){return function(){var retval=old_func();if(retval==false)
return false;else
return func_to_trigger();};})(old_func,func_to_trigger);}
replacement_functions[trigger]=final_func_to_trigger;}
return replacement_functions;}
TypeSmart={};TypeSmart.attachKeypressHandler=function(element){if(typeof my_replacements=="undefined"){var my_replacements={};}
if(typeof my_custom_triggers=="undefined"){var my_custom_triggers={};}
var replacements=mergeDicts(my_replacements,default_replacements);var custom_triggers=mergeDicts(my_custom_triggers,default_custom_triggers);var final_replacements={};for(control_class_name in replacements){if(element.classList.contains(control_class_name)){for(str_to_replace in replacements[control_class_name]){final_replacements[str_to_replace]=replacements[control_class_name][str_to_replace];}}}
var replacement_functions={};for(control_class_name in custom_triggers){if(element.classList.contains(control_class_name)){for(char_trigger in custom_triggers[control_class_name]){replacement_functions[char_trigger]=custom_triggers[control_class_name][char_trigger];}}}
replacement_functions=mergeDicts(replacement_functions,makeReplacementFunctions(final_replacements));var handler=function(event){var character=getChar(event||window.event);if(!character)return true;else if(character in replacement_functions){return replacement_functions[character]();}
else return true;};element.onkeypress=handler;};TypeSmart.init=function(){var attachableElements=document.getElementsByClassName('typeSmart');for(var i=0;i<attachableElements.length;i++){TypeSmart.attachKeypressHandler(attachableElements[i]);}};