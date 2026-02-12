// Usage: echo '<json>' | node src/scripts/json-extract.js '<expression>'
// Evaluates expression against parsed JSON and prints the result.
// Expression receives the parsed object as 'o'.
// Exits silently on parse errors or empty results.
var chunks = [];
process.stdin.on("data", function (c) { chunks.push(c); });
process.stdin.on("end", function () {
  try {
    var o = JSON.parse(chunks.join(""));
    var expr = process.argv[2];
    var val = new Function("o", "return " + expr)(o);
    if (val != null && val !== "") process.stdout.write(String(val));
  } catch (e) {
    // silent
  }
});
