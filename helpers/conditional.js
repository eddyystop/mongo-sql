
/**
 * Conditionals
 * TODO: update comments :/
 */

var conditionals = require('../lib/conditional-helpers');
var queryBuilder = require('../lib/query-builder');
var conditionBuilder = require('../lib/condition-builder');

var valuesThatUseIsOrIsNot = [
  'true', 'false', true, false, null
]

function getValueEqualityOperator(value) {
  return valuesThatUseIsOrIsNot.indexOf(value) > -1 ? 'is' : '='
}

function getValueInequalityOperator(value) {
  return valuesThatUseIsOrIsNot.indexOf(value) > -1 ? 'is not' : '!='
}

/**
 * Querying where column is equal to a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be equal to
 */
conditionals.add('$equals', function(column, value, values, collection, original){
  var equator = '=';

  return column + ' ' + getValueEqualityOperator(value) + ' ' + value;
});

/**
 * Querying where column is not equal to a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be equal to
 */
conditionals.add('$ne', function(column, value, values, collection, original){
  return column + ' ' + getValueInequalityOperator(value) + ' ' + value;
});

/**
 * Querying where column is greater than a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be greater than
 */
conditionals.add('$gt', function(column, value, values, collection, original){
  return column + ' > ' + value;
});

/**
 * Querying where column is greater than a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be greater than
 */
conditionals.add('$gte', function(column, value, values, collection, original){
  return column + ' >= ' + value;
});

/**
 * Querying where column is less than a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be less than
 */
conditionals.add('$lt', function(column, value, values, collection, original){
  return column + ' < ' + value;
});

/**
 * Querying where column is less than or equal to a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be lte to
 */
conditionals.add('$lte', function(column, value, values, collection, original){
  return column + ' <= ' + value;
});

/**
 * Querying where value is null
 * @param column {String}  - Column name either table.column or column
 */
conditionals.add('$null', function(column, value, values, collection, original){
  return column + ' is' + (original === false ? ' not' : '') + ' null';
});

/**
 * Querying where value is null
 * @param column {String}  - Column name either table.column or column
 */
conditionals.add('$notNull', function(column, value, values, collection, original){
  return column + ' is' + (original === false ? '' : ' not') + ' null';
});

/**
 * Querying where column is like a value
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be like
 */
conditionals.add('$like', function(column, value, values, collection, original){
  return column + ' like ' + value;
});

/**
 * Querying where column is like a value (case insensitive)
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - What the column should be like
 */
conditionals.add('$ilike', function(column, value, values, collection, original){
  return column + ' ilike ' + value;
});

/**
 * Querying where column is in a set
 *
 * Values
 * - String, no explaination necessary
 * - Array, joins escaped values with a comma
 * - Function, executes function, expects string in correct format
 *  |- Useful for sub-queries
 *
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - String|Array|Function
 */
conditionals.add('$in', { cascade: false }, function(column, set, values, collection, original){
  if (Array.isArray(set)) {
    return column + ' in (' + set.map( function(val){
      return '$' + values.push( val );
    }).join(', ') + ')';
  }

  return column + ' in (' + queryBuilder(set, values).toString() + ')';
});

/**
 * Querying where column is not in a set
 *
 * Values
 * - String, no explaination necessary
 * - Array, joins escaped values with a comma
 * - Function, executes function, expects string in correct format
 *  |- Useful for sub-queries
 *
 * @param column {String}  - Column name either table.column or column
 * @param value  {Mixed}   - String|Array|Function
 */
conditionals.add('$nin', { cascade: false }, function(column, set, values, collection, original){
  if (Array.isArray(set)) {
    return column + ' not in (' + set.map( function(val){
      return '$' + values.push( val );
    }).join(', ') + ')';
  }

  return column + ' not in (' + queryBuilder(set, values).toString() + ')';
});

/**
 * Querying where helper is $not, parsing to opposite of equal
 * @param column {String}  - Column name either table.column or column
 */
conditionals.add('$not', { cascade: false }, function(column, value, values, collection, original) {
  var result = 'not '

  if (typeof value === 'string') {
    result += +column + ' ' + getValueEqualityOperator(value) + ' ' + value
  } else {
    var condBuildResult = conditionBuilder(value, collection, values)
    result += "(" + condBuildResult + ")"
  }
  return result

});


conditionals.add('$custom', { cascade: false }, function(column, value, values, collection, original){
  if (Array.isArray(value))
    return conditionals.get('$custom_array').fn( column, value, values, collection );

  if (typeof value == 'object')
    return conditionals.get('$custom_object').fn( column, value, values, collection );

  throw new Error('Invalid Custom Value Input');
});

conditionals.add('$custom_array', { cascade: false }, function(column, value, values, collection, original){
  var output = value[0];
  var localToGlobalValuesIndices = {}

  return output.replace(/\$\d+/g, function(match) {
    var i = match.slice(1);

    var globalI = i in localToGlobalValuesIndices
      ? localToGlobalValuesIndices[i]
      : values.push(value[i]);

    localToGlobalValuesIndices[i] = globalI;

    return '$' + globalI;
  });
});

conditionals.add('$custom_object', { cascade: false }, function(column, value, values, collection, original){
  return conditionals.get('$custom_array').fn(column, [value.value].concat(value.values), values, collection);
});

conditionals.add('$years_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " year";
});

conditionals.add('$months_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " month";
});

conditionals.add('$days_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " day";
});

conditionals.add('$hours_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " hour";
});

conditionals.add('$minutes_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " minute";
});

conditionals.add('$seconds_ago', function(column, value, values, collection, original){
  return column + " >= now() - interval " + value + " second";
});
