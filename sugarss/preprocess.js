'use strict';

exports.__esModule = true;
exports.default = preprocess;
function indentError(input, l, p) {
    throw input.error('Mixed tabs and spaces are not allowed', l, p + 1);
}

function preprocess(input, lines) {
    var indentType = void 0;
    var prevNumber = 0;
    var parts = lines.map(function (line) {
        var lastComma = false;
        var comment = false;
        var number = prevNumber + 1;
        var atrule = false;
        var indent = '';
        var tokens = [];
        var colon = false;

        if (line.length > 0) {
            if (line[0][0] === 'space') {
                indent = line[0][1];
                tokens = line.slice(1);
            } else {
                indent = '';
                tokens = line;
            }

            if (!indentType && indent.length) {
                indentType = indent[0] === ' ' ? 'space' : 'tab';
            }
            if (indentType === 'space') {
                if (indent.indexOf('\t') !== -1) {
                    indentError(input, number, indent.indexOf('\t'));
                }
            } else if (indentType === 'tab') {
                if (indent.indexOf(' ') !== -1) {
                    indentError(input, number, indent.indexOf(' '));
                }
            }

            if (tokens.length) {
                for (var i = tokens.length - 1; i >= 0; i--) {
                    var type = tokens[i][0];
                    if (type === ',') {
                        lastComma = true;
                        break;
                    } else if (type === 'space') {
                        continue;
                    } else if (type === 'comment') {
                        continue;
                    } else if (type === 'newline') {
                        continue;
                    } else {
                        break;
                    }
                }
                comment = tokens[0][0] === 'comment';
                atrule = tokens[0][0] === 'at-word';

                var brackets = 0;
                for (var _i = 0; _i < tokens.length - 1; _i++) {
                    var _type = tokens[_i][0];
                    var next = tokens[_i + 1][0];
                    if (_type === '(') {
                        brackets += 1;
                    } else if (_type === ')') {
                        brackets -= 1;
                    } else if (_type === ':' && brackets === 0 && (next === 'space' || next === 'newline')) {
                        colon = true;
                    }
                }
            }

            var last = tokens[tokens.length - 1];
            if (last && last[0] === 'newline') prevNumber = last[2];
        }

        return {
            number: number,
            indent: indent,
            colon: colon,
            tokens: tokens,
            atrule: atrule,
            comment: comment,
            lastComma: lastComma,
            before: ''
        };
    });

    parts = parts.reduceRight(function (all, i) {
        if (!i.tokens.length || i.tokens.every(function (j) {
            return j[0] === 'newline';
        })) {
            var prev = all[0];
            var before = i.indent + i.tokens.map(function (j) {
                return j[1];
            }).join('');
            prev.before = before + prev.before;
        } else {
            all.unshift(i);
        }
        return all;
    }, [{ end: true, before: '' }]);

    parts.forEach(function (part, i) {
        if (i === 0) return;

        var prev = parts[i - 1];
        var last = prev.tokens[prev.tokens.length - 1];
        if (last && last[0] === 'newline') {
            part.before = last[1] + part.before;
            prev.tokens.pop();
        }
    });

    return parts;
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByZXByb2Nlc3MuZXM2Il0sIm5hbWVzIjpbInByZXByb2Nlc3MiLCJpbmRlbnRFcnJvciIsImlucHV0IiwibCIsInAiLCJlcnJvciIsImxpbmVzIiwiaW5kZW50VHlwZSIsInByZXZOdW1iZXIiLCJwYXJ0cyIsIm1hcCIsImxhc3RDb21tYSIsImNvbW1lbnQiLCJudW1iZXIiLCJhdHJ1bGUiLCJpbmRlbnQiLCJ0b2tlbnMiLCJjb2xvbiIsImxpbmUiLCJsZW5ndGgiLCJzbGljZSIsImluZGV4T2YiLCJpIiwidHlwZSIsImJyYWNrZXRzIiwibmV4dCIsImxhc3QiLCJiZWZvcmUiLCJyZWR1Y2VSaWdodCIsImFsbCIsImV2ZXJ5IiwiaiIsInByZXYiLCJqb2luIiwidW5zaGlmdCIsImVuZCIsImZvckVhY2giLCJwYXJ0IiwicG9wIl0sIm1hcHBpbmdzIjoiOzs7a0JBSXdCQSxVO0FBSnhCLFNBQVNDLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCQyxDQUE1QixFQUErQkMsQ0FBL0IsRUFBa0M7QUFDOUIsVUFBTUYsTUFBTUcsS0FBTixDQUFZLHVDQUFaLEVBQXFERixDQUFyRCxFQUF3REMsSUFBSSxDQUE1RCxDQUFOO0FBQ0g7O0FBRWMsU0FBU0osVUFBVCxDQUFvQkUsS0FBcEIsRUFBMkJJLEtBQTNCLEVBQWtDO0FBQzdDLFFBQUlDLG1CQUFKO0FBQ0EsUUFBSUMsYUFBYSxDQUFqQjtBQUNBLFFBQUlDLFFBQVFILE1BQU1JLEdBQU4sQ0FBVSxnQkFBUTtBQUMxQixZQUFJQyxZQUFZLEtBQWhCO0FBQ0EsWUFBSUMsVUFBWSxLQUFoQjtBQUNBLFlBQUlDLFNBQVlMLGFBQWEsQ0FBN0I7QUFDQSxZQUFJTSxTQUFZLEtBQWhCO0FBQ0EsWUFBSUMsU0FBWSxFQUFoQjtBQUNBLFlBQUlDLFNBQVksRUFBaEI7QUFDQSxZQUFJQyxRQUFZLEtBQWhCOztBQUVBLFlBQUtDLEtBQUtDLE1BQUwsR0FBYyxDQUFuQixFQUF1QjtBQUNuQixnQkFBS0QsS0FBSyxDQUFMLEVBQVEs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KGlucHV0LCBsLCBwKSB7XG4gICAgdGhyb3cgaW5wdXQuZXJyb3IoJ01peGVkIHRhYnMgYW5kIHNwYWNlcyBhcmUgbm90IGFsbG93ZWQnLCBsLCBwICsgMSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByZXByb2Nlc3MoaW5wdXQsIGxpbmVzKSB7XG4gICAgbGV0IGluZGVudFR5cGU7XG4gICAgbGV0IHByZXZOdW1iZXIgPSAwO1xuICAgIGxldCBwYXJ0cyA9IGxpbmVzLm1hcChsaW5lID0+IHtcbiAgICAgICAgbGV0IGxhc3RDb21tYSA9IGZhbHNlO1xuICAgICAgICBsZXQgY29tbWVudCAgID0gZmFsc2U7XG4gICAgICAgIGxldCBudW1iZXIgICAgPSBwcmV2TnVtYmVyICsgMTtcbiAgICAgICAgbGV0IGF0cnVsZSAgICA9IGZhbHNlO1xuICAgICAgICBsZXQgaW5kZW50ICAgID0gJyc7XG4gICAgICAgIGxldCB0b2tlbnMgICAgPSBbXTtcbiAgICAgICAgbGV0IGNvbG9uICAgICA9IGZhbHNlO1xuXG4gICAgICAgIGlmICggbGluZS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgaWYgKCBsaW5lWzBdWzBdID09PSAnc3BhY2UnICkge1xuICAgICAgICAgICAgICAgIGluZGVudCA9IGxpbmVbMF1bMV07XG4gICAgICAgICAgICAgICAgdG9rZW5zID0gbGluZS5zbGljZSgxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5kZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgdG9rZW5zID0gbGluZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCAhaW5kZW50VHlwZSAmJiBpbmRlbnQubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgIGluZGVudFR5cGUgPSBpbmRlbnRbMF0gPT09ICcgJyA/ICdzcGFjZScgOiAndGFiJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICggaW5kZW50VHlwZSA9PT0gJ3NwYWNlJyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIGluZGVudC5pbmRleE9mKCdcXHQnKSAhPT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudEVycm9yKGlucHV0LCBudW1iZXIsIGluZGVudC5pbmRleE9mKCdcXHQnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICggaW5kZW50VHlwZSA9PT0gJ3RhYicgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBpbmRlbnQuaW5kZXhPZignICcpICE9PSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50RXJyb3IoaW5wdXQsIG51bWJlciwgaW5kZW50LmluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIHRva2Vucy5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSB0b2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0gKSAge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHRva2Vuc1tpXVswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnLCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Q29tbWEgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHR5cGUgPT09ICdzcGFjZScgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggdHlwZSA9PT0gJ2NvbW1lbnQnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHR5cGUgPT09ICduZXdsaW5lJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29tbWVudCA9IHRva2Vuc1swXVswXSA9PT0gJ2NvbW1lbnQnO1xuICAgICAgICAgICAgICAgIGF0cnVsZSAgPSB0b2tlbnNbMF1bMF0gPT09ICdhdC13b3JkJztcblxuICAgICAgICAgICAgICAgIGxldCBicmFja2V0cyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aCAtIDE7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSB0b2tlbnNbaV1bMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gdG9rZW5zW2kgKyAxXVswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnKCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmFja2V0cyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB0eXBlID09PSAnKScgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmFja2V0cyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB0eXBlID09PSAnOicgJiYgYnJhY2tldHMgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmV4dCA9PT0gJ3NwYWNlJyB8fCBuZXh0ID09PSAnbmV3bGluZScpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbGFzdCA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIGxhc3QgJiYgbGFzdFswXSA9PT0gJ25ld2xpbmUnICkgcHJldk51bWJlciA9IGxhc3RbMl07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbnVtYmVyLFxuICAgICAgICAgICAgaW5kZW50LFxuICAgICAgICAgICAgY29sb24sXG4gICAgICAgICAgICB0b2tlbnMsXG4gICAgICAgICAgICBhdHJ1bGUsXG4gICAgICAgICAgICBjb21tZW50LFxuICAgICAgICAgICAgbGFzdENvbW1hLFxuICAgICAgICAgICAgYmVmb3JlOiAnJ1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgcGFydHMgPSBwYXJ0cy5yZWR1Y2VSaWdodCggKGFsbCwgaSkgPT4ge1xuICAgICAgICBpZiAoICFpLnRva2Vucy5sZW5ndGggfHwgaS50b2tlbnMuZXZlcnkoaiA9PiBqWzBdID09PSAnbmV3bGluZScpICkge1xuICAgICAgICAgICAgbGV0IHByZXYgICAgPSBhbGxbMF07XG4gICAgICAgICAgICBsZXQgYmVmb3JlICA9IGkuaW5kZW50ICsgaS50b2tlbnMubWFwKCBqID0+IGpbMV0gKS5qb2luKCcnKTtcbiAgICAgICAgICAgIHByZXYuYmVmb3JlID0gYmVmb3JlICsgcHJldi5iZWZvcmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbGwudW5zaGlmdChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsO1xuICAgIH0sIFt7IGVuZDogdHJ1ZSwgYmVmb3JlOiAnJyB9XSk7XG5cbiAgICBwYXJ0cy5mb3JFYWNoKCAocGFydCwgaSkgPT4ge1xuICAgICAgICBpZiAoIGkgPT09IDAgKSByZXR1cm47XG5cbiAgICAgICAgbGV0IHByZXYgPSBwYXJ0c1tpIC0gMV07XG4gICAgICAgIGxldCBsYXN0ID0gcHJldi50b2tlbnNbcHJldi50b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmICggbGFzdCAmJiBsYXN0WzBdID09PSAnbmV3bGluZScgKSB7XG4gICAgICAgICAgICBwYXJ0LmJlZm9yZSA9IGxhc3RbMV0gKyBwYXJ0LmJlZm9yZTtcbiAgICAgICAgICAgIHByZXYudG9rZW5zLnBvcCgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFydHM7XG59XG4iXX0=