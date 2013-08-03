
TypeSmart={};TypeSmart.smartDoubleQuote=function(){var cursor=Cursor.new();if(/^\s*$/.test(cursor.getText(-1,0))){cursor.insert("“");return false;}
else{cursor.insert("”");return false;}
return true;};TypeSmart.smartSingleQuote=function(){var cursor=Cursor.new();if(/^\s*$/.test(cursor.getText(-1,0))){cursor.insert("‘");return false;}
else{cursor.insert("’");return false;}
return true;};TypeSmart.smartQuoteTextReplace=function(text){return text.replace(/(\s)'/g,"$1\u2018").replace(/(\s)"/g,"$1\u201c").replace(/(.)'/g,"$1\u2019").replace(/(.)"/g,"$1\u201d").replace(/'/g,"\u2018").replace(/"/g,"\u201c");};TypeSmart.default_custom_triggers={'typeSmartTypography':{'"':TypeSmart.smartDoubleQuote,"'":TypeSmart.smartSingleQuote,"\\random":(function(){Cursor.new().insert("COMMAND ACTIVATED");})}};TypeSmart.default_replacements={'typeSmartEmoticons':{":)":"😊",":-)":"😊",":(":"😞",":-(":"😞","<3":"♥"},'typeSmartTypography':{"...":"…","--":"—"}};TypeSmart.default_paste_modifiers={'typeSmartTypography':{'replace single and double dumb quotes with smart ones':TypeSmart.smartQuoteTextReplace}};TypeSmart.mergeDicts=function(dict1,dict2){var result={};for(key in dict1){result[key]=dict1[key];}
for(key in dict2){if((key in result)&&(typeof(result[key])=='object')&&(typeof(dict2[key])=='object')){result[key]=TypeSmart.mergeDicts(result[key],dict2[key]);}
else{result[key]=dict2[key];}}
return result;};TypeSmart.makeReplacementFunctions=function(replacements){var replacement_functions={};for(replacement_string in replacements){var trigger=replacement_string[replacement_string.length-1];var prefix_to_match=replacement_string.substring(0,replacement_string.length-1);var func_to_trigger=(function(prefix_to_match,replacement_string,replacements){return function(){var cursor=Cursor.new();var prefix=cursor.getText(-prefix_to_match.length,0);if(prefix==prefix_to_match){cursor.deleteBackward(prefix.length);if(typeof replacements[replacement_string]=='string'){cursor.insert(replacements[replacement_string]);return false;}
else if(typeof replacements[replacement_string]=='function'){replacements[replacement_string]();return false;}
else{return true;}}
else return true;};})(prefix_to_match,replacement_string,replacements);var final_func_to_trigger=func_to_trigger;if(trigger in replacement_functions){var old_func=replacement_functions[trigger];final_func_to_trigger=(function(old_func,func_to_trigger){return function(){var retval=old_func();if(retval==false)
return false;else
return func_to_trigger();};})(old_func,func_to_trigger);}
replacement_functions[trigger]=final_func_to_trigger;}
return replacement_functions;};Array.prototype.contains=function(element){for(var i=0;i<this.length;i++){if(this[i]==element)return true;}
return false;};TypeSmart.unifyWithKeyWhitelist=function(object,whiteList){var final_object={};for(key in object){if(whiteList.contains(key)){final_object=TypeSmart.mergeDicts(final_object,object[key]);}}
return final_object;};TypeSmart.getPasteHandler=function(class_list){if(typeof my_replacements=="undefined"){var my_replacements={};}
if(typeof my_paste_modifiers=="undefined"){var my_paste_modifiers={};}
var replacements=TypeSmart.unifyWithKeyWhitelist(TypeSmart.mergeDicts(my_replacements,TypeSmart.default_replacements),class_list);var direct_replacements_func=(function(replacements){return function(text){for(to_be_replaced in replacements){text=text.split(to_be_replaced).join(replacements[to_be_replaced]);}
return text;};})(replacements);var paste_modifiers=TypeSmart.unifyWithKeyWhitelist(TypeSmart.mergeDicts(my_paste_modifiers,TypeSmart.default_paste_modifiers),class_list);var combined_from_pre_defined=direct_replacements_func;for(discription in paste_modifiers){var next_func=paste_modifiers[discription];combined_from_pre_defined=(function(func1,func2){return function(text){return func1(func2(text));};})(combined_from_pre_defined,next_func);}
var handler=(function(replacement_func){return function(event){var pasted_text=event.clipboardData.getData('text/plain');Cursor.new().insert(replacement_func(pasted_text));return false;};})(combined_from_pre_defined);return handler;};TypeSmart.getKeypressHandler=function(class_list){if(typeof my_replacements=="undefined"){var my_replacements={};}
if(typeof my_custom_triggers=="undefined"){var my_custom_triggers={};}
var replacements=TypeSmart.mergeDicts(my_replacements,TypeSmart.default_replacements);var custom_triggers=TypeSmart.mergeDicts(my_custom_triggers,TypeSmart.default_custom_triggers);var final_replacements=TypeSmart.unifyWithKeyWhitelist(replacements,class_list);var replacement_functions=TypeSmart.unifyWithKeyWhitelist(custom_triggers,class_list);replacement_functions=TypeSmart.mergeDicts(TypeSmart.makeReplacementFunctions(replacement_functions),TypeSmart.makeReplacementFunctions(final_replacements));var getChar=function(event){if(event.which!=0&&event.charCode!=0){return String.fromCharCode(event.which);}
else{return null;}};var handler=(function(replacement_functions,getChar){return function(event){var character=getChar(event||window.event);if(!character)return true;else if(character in replacement_functions){return replacement_functions[character]();}
else return true;};})(replacement_functions,getChar);return handler;};TypeSmart.attachHandlers=function(element){var class_list=element.className.split(/\s+/);element.onkeypress=TypeSmart.getKeypressHandler(class_list);element.onpaste=TypeSmart.getPasteHandler(class_list);};TypeSmart.init=function(){var libcursor=document.createElement("script");libcursor.setAttribute('type','text/javascript');libcursor.setAttribute('src','//raw.github.com/sujeetgholap/libcursor/master/libcursor.js');document.head.appendChild(libcursor);var attachableElements=document.getElementsByClassName('typeSmart');for(var i=0;i<attachableElements.length;i++){TypeSmart.attachHandlers(attachableElements[i]);}};