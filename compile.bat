
java -jar closure-compiler\compiler.jar --js src\base.js --js src\arrays.js --js src\coretypes.js --js src\logging.js --js src\changes.js --js src\databinding.js --js src\changes.reverseproperties.js --js src\entities.js --js_output_file=dist\tent.js --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT

java -jar closure-compiler\compiler.jar --js src\base.js --js src\arrays.js --js src\coretypes.js --js src\logging.js --js src\changes.js --js src\databinding.js --js src\changes.reverseproperties.js --js src\entities.js --js_output_file=dist\tent.min.js
