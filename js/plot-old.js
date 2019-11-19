var meta_info = [];
var cond_name = [];
var cond_0 = [];
var cond_1 = [];
var cdr3_length = [];
var curr_cond = 1;
var curr_chain = "TRA";
var curr_func = "sum";
var functionNames = {
  'sum': 'Sum',
  'avg': 'Average'
};

d3.text("data/out/meta.csv").then(function (data) {

  var meta_rows = d3.csvParseRows(data);

  var meta_header = meta_rows[0];

  for (let j = 1; j < meta_rows.length; j++) {

    if (j == 1) {
      for (let j = 1; j < meta_header.length; j++) {
        // Set up meta info and cdr3 length data structures
        cond_name[j] = meta_header[j].split("|")[0];
        cond_0[j] = meta_header[j].split("|")[1];
        cond_1[j] = meta_header[j].split("|")[2];
        meta_info[cond_name[j]] = [];
        meta_info[cond_name[j]][cond_0[j]] = [];
        meta_info[cond_name[j]][cond_1[j]] = [];
        cdr3_length[cond_name[j]] = [];
        cdr3_length[cond_name[j]][cond_0[j]] = [];
        cdr3_length[cond_name[j]][cond_1[j]] = [];

        if (j == (meta_header.length - 1)) {
          $(document).ready(function () {
            for (let k = 1; k < cond_name.length; k++) {
              $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
            }
            $("#dropdownCondition").text(cond_name[curr_cond]);
          });
        }
      }
    }

    for (let i = 1; i < meta_header.length; i++) {
      // Populate available conditions
      if (meta_rows[j][i] == "0") {
        meta_info[cond_name[i]][cond_0[i]].push(meta_rows[j][0]);
      } else if (meta_rows[j][i] == "1") {
        meta_info[cond_name[i]][cond_1[i]].push(meta_rows[j][0]);
      }
    }

    if (j == (meta_rows.length - 1)) {

      d3.text("data/out/cdr3_length.csv").then(function (data) {

        var cdr3_rows = d3.csvParseRows(data);
        for (let i = 1; i < cdr3_rows.length; i++) {

          for (let k = 1; k < cond_name.length; k++) {
            if (meta_info[cond_name[k]][cond_0[k]].includes(cdr3_rows[i][0])) {
              // Populate if chain is undefined
              if (cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]] == undefined) {
                cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]] = [];
                cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["sum"] = Array(40).fill(0);
                cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["avg"] = Array(40).fill(0);
              }
              // Add to existing numbers
              cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["sum"] = cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["sum"].map(function (num, idx) {
                return parseInt(num) + parseInt(cdr3_rows[i].slice(2)[idx]);
              });

              cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["avg"] = cdr3_length[cond_name[k]][cond_0[k]][cdr3_rows[i][1]]["avg"].map(function (num, idx) {
                return ((parseFloat(num) + parseFloat(cdr3_rows[i].slice(2)[idx])) / 2);
              });

            } else if (meta_info[cond_name[k]][cond_1[k]].includes(cdr3_rows[i][0])) {
              // Populate if chain is undefined
              if (cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]] == undefined) {
                cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]] = [];
                cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["sum"] = Array(40).fill(0);
                cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["avg"] = Array(40).fill(0);
              }
              // Add to existing numbers
              cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["sum"] = cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["sum"].map(function (num, idx) {
                return parseInt(num) + parseInt(cdr3_rows[i].slice(2)[idx]);
              });

              cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["avg"] = cdr3_length[cond_name[k]][cond_1[k]][cdr3_rows[i][1]]["avg"].map(function (num, idx) {
                return ((parseFloat(num) + parseFloat(cdr3_rows[i].slice(2)[idx])) / 2);
              });


            }

            if (i == (cdr3_rows.length - 1)) {
              // Update plot with accumulated values
              var update = {
                x: [[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120]],
                y: [cdr3_length[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func]],
                name: [cond_0[curr_cond]],
                visible: true
              }
              Plotly.restyle('cdr3Div', update, 0);
              // Update plot with accumulated values
              var update = {
                x: [[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120]],
                y: [cdr3_length[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func]],
                name: [cond_1[curr_cond]],
                visible: true
              }
              Plotly.restyle('cdr3Div', update, 1);

            }
          }
        }
      })
    }
  }
})

div_pre = []
div_post = []

d3.text("data/out/diversity.csv").then(function (data) {
  // Parse diversity CSV
  var entries = d3.csvParseRows(data);
  for (let j = 1; j < entries.length; j++) {

    if (entries[j][1] == "On") {
      div_post.push(entries[j][2])
    } else {
      div_pre.push(entries[j][2])
    }

    if (j == (entries.length - 1)) {
      var update = {
        visible: true
      }
      Plotly.restyle('diversityDiv', update, 0);
      Plotly.restyle('diversityDiv', update, 1);
    }

  }
})

$(document).ready(function () {

  var trace1 = {
    y: div_pre,
    name: 'Pre-Treatment',
    marker: { color: '#3D9970' },
    type: 'box',
    boxpoints: 'all'
  };

  var trace2 = {
    y: div_post,
    name: 'Post-Treatment',
    marker: { color: '#FF4136' },
    type: 'box',
    boxpoints: 'all'
  };

  var data = [trace1, trace2];

  var layout = {
    title: 'Diversity',
    yaxis: {
      title: 'True Diversity',
      zeroline: false
    },
    xaxis: {
      title: 'Group'
    },
    boxmode: 'group',
    updatemenus: [{
      direction: 'left',
      showactive: false,
      type: 'buttons',
      x: 0,
      xanchor: 'left',
      y: 1.2,
      yanchor: 'top'
    }]
  };

  Plotly.newPlot('diversityDiv', data, layout);

  var trace1 = {
    histfunc: "sum",
    type: "histogram",
    opacity: 0.5,
    marker: {
      color: 'green',
    },
    xbins: {
      size: 3
    }
  };
  var trace2 = {
    histfunc: "sum",
    type: "histogram",
    opacity: 0.6,
    marker: {
      color: 'red',
    },
    xbins: {
      size: 3
    }
  };

  var data = [trace1, trace2];
  var layout = {
    barmode: "group",
    title: 'CDR3 Length',
    yaxis: {
      title: 'CDR3 Quantity',
      zeroline: false
    },
    xaxis: {
      title: 'CDR3 length (nucleotides)',
      tickvals: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120],
      ticktext: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114, 117, "120+"]
    }
  };
  Plotly.newPlot("cdr3Div", data, layout);

  // URL location hash show/hide support
  if (window.location.pathname.split('/').pop() == 'cohort_analysis.html') {
    if (location.hash == "") {
      $('.content_row').show();
    } else if ($.inArray(location.hash, ["#DYN", "#STAT"]) >= 0) {
      var classes = {};
      classes['#DYN'] = '.dynamic';
      classes['#STAT'] = '.static';
      $('.content_row').hide();
      $(classes[location.hash]).show();
    } else {
      $('.content_row').hide();
      $(types[location.hash]).show();
    }
  }

  $("#dropdownChain").text(curr_chain);
  $("#dropdownFunction").text(functionNames[curr_func]);

});

function dataMorph(cond, chain, func) {
  // Condition change
  if (typeof cond != "undefined") {
    curr_cond = cond;
    $("#dropdownCondition").text(cond_name[curr_cond]);
  }
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain = chain;
    $("#dropdownChain").text(curr_chain);
  }
  if (typeof func != "undefined") {
    curr_func = func;
    $("#dropdownFunction").text(functionNames[curr_func]);
  }
  // Function change
  var update = {
    y: [cdr3_length[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func]],
    name: [cond_0[curr_cond]],
    visible: true
  }
  Plotly.restyle('cdr3Div', update, 0);

  var update = {
    y: [cdr3_length[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func]],
    name: [cond_1[curr_cond]],
    visible: true
  }
  Plotly.restyle('cdr3Div', update, 1);

}
// Make plot visible or invisible
function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}
