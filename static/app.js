
var dirty = {};
var table = null;

function tableCellFor(d) {
    if (d.name == 'name') {
        var name = encodeURIComponent(d.name); 
        var href = 'http://fantasynews.cbssports.com/fantasyfootball/playersearch?sb=1&name='+d.value;
        return '<a class="player-link" href="'+href+'"" target="_blank">'+d.value+'</a>';
    } else if (d.name == 'taken') {
        if (d.value) {
            return '<input type="checkbox" checked/>';
        } else {
            return '<input type="checkbox"/>';
        }
    } else {
        return d.value; 
    }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

/* Render the player table using d3 */
function render(data) {
    columns = ['rank','name','taken','adp','pos','team','bye','age','exp']

    var table = d3.select('#container').append('table')
        .attr('id', 'players')
        .attr('class', 'table')
    thead = table.append('thead')
    tbody = table.append('tbody')

    // Append header row
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(function(col) { return toTitleCase(col); });

    // Create a row for each object
    var rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')

    var cells = rows.selectAll('td')
        .data(function(row) {
            return columns.map(function(column) {
                return {name: column, value: row[column]}; 
            });
        })
        .enter()
        .append('td') 
        .html(tableCellFor)

    $('#players input').change(function() {
        var data = d3.select(this.parentNode.parentNode).data()[0];
        console.log(data);
        data.taken = this.checked;
        dirty[data.name] = data;
        save();
    });

    return table;
}

/* Save to DB */
function save() {
    var players = $.map(dirty, function(value, key) {
        return value;
    });
    $.ajax({
        url: '/players',
        data: JSON.stringify(players),
        contentType: 'application/json', 
        method: 'POST',
    }).done(function() {

    }).fail(function() {
        alert("failed");
    });
    dirty = {};
}

/* Filter out any rows in the table that don't match 'text' */
function filter() {
    var query = $('#filter').val();
    var tokens = query.split(/\s+/); 
    var fields = $.map(tokens, function(token) {
        return [token.split('=')];
    });

    var rows = d3.selectAll('#players tbody tr');
    rows.style('display', null);
    rows.filter(function(d) {
        var match = true;
        $.each(fields, function(i, field) {
            var name = field[0];
            var search = field[1];
            var val = d[name];
            if (val) {
                val = val.toString();
                if (val.toLowerCase().indexOf(search.toLowerCase()) <= -1) {
                    match = false;
                }
            }
        }) 
        return !match;
    }).style('display', 'none');
}

var delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();


$(document).ready(function() {
    d3.json('/players', function(err, data) {
        table = render(data);
    });

    $('#filter').keyup(function() {
        delay(filter, 200);
    });
})
