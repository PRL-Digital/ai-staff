// Usage: node src/scripts/json-extract.js '<json>' '<expression>'
// Evaluates expression against parsed JSON and prints the result.
// Expression receives the parsed object as 'o'.
// Exits silently on parse errors or empty results.
try {
  var o = JSON.parse(process.argv[2]);
  var expr = process.argv[3];
  var val = new Function("o", "return " + expr)(o);
  if (val != null && val !== "") process.stdout.write(String(val));
} catch (e) {
  // silent
}
