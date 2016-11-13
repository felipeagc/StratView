var gulp = require("gulp");
var ts = require("gulp-typescript");
var shell = require("gulp-shell");

gulp.task("default", function() {
    return gulp.src("src/**/*.ts")
        .pipe(ts({
            "module": "commonjs",
            "target": "es5",
            "allowJs": true,
            "removeComments": true,
            "types": [
                "node"
            ]
        }))
        .pipe(gulp.dest('build'));
});

gulp.task("run", ["default"], shell.task(["node build/index.js"]));
