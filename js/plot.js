var meta_info = [];
var cond_name = [];
var samples = [[], []];
var ica_data = [];
var ica_header = [];
var curr_cond = 0;
var curr_chain = "TRB";
var curr_func = "CDR3 Length";
var condition_2nd_x = [[], []];
var in_chain = [];
var curr_cond_2nd = 0;
var activated_cond_2nd = false;
var curr_y = [[], []];
var pval_arrays = [[], [], [], []];

d3.text("data/meta.csv").then(function (data) {

  var meta_rows = d3.csvParseRows(data);

  var meta_header = meta_rows[0].slice(1);

  for (let j = 1; j < meta_rows.length; j++) {

    if (j == 1) {
      for (let j = 0; j < meta_header.length; j++) {
        // Set up meta info and intracohort data structures
        cond_name[j] = meta_header[j].split("|")[0];
        samples[0][j] = meta_header[j].split("|")[1];
        samples[1][j] = meta_header[j].split("|")[2];
        meta_info[cond_name[j]] = [];
        meta_info[cond_name[j]][samples[0][j]] = [];
        meta_info[cond_name[j]][samples[1][j]] = [];
        ica_data[cond_name[j]] = [];
        ica_data[cond_name[j]][samples[0][j]] = [];
        ica_data[cond_name[j]][samples[1][j]] = [];

        if (j == (meta_header.length - 1)) {
          $(document).ready(function () {
            for (let k = 0; k < cond_name.length; k++) {
              $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
              if (cond_name.length > 0) {
                if (k == 0) {
                  $("#button2nd_condition").removeAttr('style');
                }
                $("#condition2nd_selection").append("<a class='dropdown-item' onclick='condition_2nd(" + k + ")'>" + cond_name[k] + "</a>");
              }
              if (k == cond_name.length - 1) {
                $("#condition2nd_selection").children().filter(function () {
                  return $(this).text() === cond_name[curr_cond];
                }).css("display", "none");
              }
            }
            $("#dropdownCondition").text(cond_name[curr_cond]);
          });
        }
      }
    }

    for (let i = 0; i < meta_header.length; i++) {
      // Populate available conditions
      if (meta_rows[j][i + 1] == "0") {
        meta_info[cond_name[i]][samples[0][i]].push(meta_rows[j][0]);
      } else if (meta_rows[j][i + 1] == "1") {
        meta_info[cond_name[i]][samples[1][i]].push(meta_rows[j][0]);
      }
    }

    if (j == (meta_rows.length - 1)) {

      d3.text("data/intracohort_data.csv").then(function (data) {

        var data_rows = d3.csvParseRows(data);

        ica_header = data_rows[0].slice(2);

        for (let i = 1; i < data_rows.length; i++) {

          in_chain[data_rows[i][1]] = in_chain[data_rows[i][1]] || [];
          in_chain[data_rows[i][1]].push(data_rows[i][0]);

          for (let k = 0; k < cond_name.length; k++) {
            if (meta_info[cond_name[k]][samples[0][k]].includes(data_rows[i][0])) {
              // Populate if chain is undefined
              ica_data[cond_name[k]][samples[0][k]][data_rows[i][1]] = ica_data[cond_name[k]][samples[0][k]][data_rows[i][1]] || [];
              for (let m = 0; m < ica_header.length; m++) {
                ica_data[cond_name[k]][samples[0][k]][data_rows[i][1]][ica_header[m]] = ica_data[cond_name[k]][samples[0][k]][data_rows[i][1]][ica_header[m]] || [];
                ica_data[cond_name[k]][samples[0][k]][data_rows[i][1]][ica_header[m]].push(data_rows[i][m + 2])
              }
            } else if (meta_info[cond_name[k]][samples[1][k]].includes(data_rows[i][0])) {
              // Populate if chain is undefined
              ica_data[cond_name[k]][samples[1][k]][data_rows[i][1]] = ica_data[cond_name[k]][samples[1][k]][data_rows[i][1]] || [];
              for (let m = 0; m < ica_header.length; m++) {
                ica_data[cond_name[k]][samples[1][k]][data_rows[i][1]][ica_header[m]] = ica_data[cond_name[k]][samples[1][k]][data_rows[i][1]][ica_header[m]] || [];
                ica_data[cond_name[k]][samples[1][k]][data_rows[i][1]][ica_header[m]].push(data_rows[i][m + 2])
              }

            }

            if (i == (data_rows.length - 1)) {
              // Update plot with accumulated values
              var update = {
                y: [ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func]],
                name: [samples[0][curr_cond]],
                visible: true
              }
              Plotly.restyle('intracohortDiv', update, 0);
              // Update plot with accumulated values
              var update = {
                y: [ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func]],
                name: [samples[1][curr_cond]],
                visible: true
              }
              Plotly.restyle('intracohortDiv', update, 1);

              var update = {
                annotations: [{
                  showarrow: false,
                  text: "p-value: " + mannwhitneyu.test(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func], ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5),
                  x: 0.5,
                  xref: 'paper',
                  y: -.175,
                  yref: 'paper',
                  font: {
                    size: 12,
                    color: 'black'
                  }
                }
                ]
              }
              Plotly.relayout('intracohortDiv', update);

            }
          }
          if (i == (data_rows.length - 1)) {
            $(document).ready(function () {
              for (let n = 0; n < ica_header.length; n++) {
                $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + ica_header[n] + "</a>");
              }
              $("#dropdownFondition").text(ica_header[curr_func]);

              var available_chains = Object.keys(in_chain);

              for (let n = 0; n < available_chains.length; n++) {
                $("#chain_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,&quot;" + available_chains[n] + "&quot;,undefined)'>" + available_chains[n] + "</a>");
              }

            });
          }
        }
      })
    }
  }
})

$(document).ready(function () {

  var trace1 = {
    marker: { color: '#3D9970' },
    type: 'box',
    boxpoints: 'all'
  };

  var trace2 = {
    marker: { color: '#FF4136' },
    type: 'box',
    boxpoints: 'all'
  };

  var data = [trace1, trace2];

  var layout = {
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
      zeroline: false
    },
    xaxis: {
      title: 'Group'
    },
    boxmode: 'group'
  };


  Plotly.newPlot("intracohortDiv", data, layout);

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
  $("#dropdownFunction").text(curr_func);

});

function dataMorph(cond, chain, func) {
  // Condition change
  if (typeof cond != "undefined") {
    curr_cond = cond;
    $("#dropdownCondition").text(cond_name[curr_cond]);
    $("#condition2nd_selection").children().filter(function () {
      return $(this).text() === cond_name[curr_cond];
    }).css("display", "none");
    $("#condition2nd_selection").children().filter(function () {
      return $(this).text() !== cond_name[curr_cond];
    }).removeAttr('style');
  }
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain = chain;
    $("#dropdownChain").text(curr_chain);
  }
  // Function change
  if (typeof func != "undefined") {
    curr_func = ica_header[func];
    $("#dropdownFunction").text(curr_func);
    var update = {
      yaxis: {
        title: curr_func,
        zeroline: false
      }
    }
    Plotly.relayout('intracohortDiv', update)
  }

  var update = {
    y: [ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func]],
    name: [samples[0][curr_cond]],
    visible: true
  }
  Plotly.restyle('intracohortDiv', update, 0);

  var update = {
    y: [ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func]],
    name: [samples[1][curr_cond]],
    visible: true
  }
  Plotly.restyle('intracohortDiv', update, 1);

  var update = {
    annotations: [{
      showarrow: false,
      text: "p-value: " + mannwhitneyu.test(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func], ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5),
      x: 0.5,
      xref: 'paper',
      y: -.175,
      yref: 'paper',
      font: {
        size: 12,
        color: 'black'
      }
    }
    ]
  }
  Plotly.relayout('intracohortDiv', update);

  if (activated_cond_2nd == true) {
    condition_2nd(curr_cond_2nd);
  }

}
// Make plot visible or invisible
function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}

function condition_2nd(cond_2nd_name) {

  curr_cond_2nd = cond_2nd_name;

  activated_cond_2nd = true;

  condition_2nd_x = [[], []];

  pval_arrays = [[], [], [], []];

  var current_sample = [meta_info[cond_name[curr_cond]][samples[0][curr_cond]], meta_info[cond_name[curr_cond]][samples[1][curr_cond]]]

  curr_y = [[], []];

  for (let i = 0; i < current_sample.length; i++) {
    var count = 0;
    for (let j = 0; j < current_sample[i].length; j++) {
      var sample = current_sample[i][j];
      var chain_included = in_chain[curr_chain].includes(sample);
      if (meta_info[cond_name[cond_2nd_name]][samples[0][cond_2nd_name]].includes(sample) && chain_included) {

        condition_2nd_x[i].push(samples[0][cond_2nd_name]);

        if (i == 0) {
          curr_y[0].push(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func][count]);
          pval_arrays[0].push(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func][count]);
        } else if (i == 1) {
          curr_y[1].push(ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func][count]);
          pval_arrays[1].push(ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func][count]);
        }

      } else if (meta_info[cond_name[cond_2nd_name]][samples[1][cond_2nd_name]].includes(sample) && chain_included) {

        condition_2nd_x[i].push(samples[1][cond_2nd_name]);

        if (i == 0) {
          curr_y[0].push(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func][count]);
          pval_arrays[2].push(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func][count]);
        } else if (i == 1) {
          curr_y[1].push(ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func][count]);
          pval_arrays[3].push(ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func][count]);
        }

      } else if (chain_included == false) {
        count = count - 1;
      }
      count = count + 1;
    }
  }

  var update = {
    x: [condition_2nd_x[0]],
    y: [curr_y[0]]
  }
  Plotly.restyle('intracohortDiv', update, 0);
  // Update plot with accumulated values
  var update = {
    x: [condition_2nd_x[1]],
    y: [curr_y[1]]
  }
  Plotly.restyle('intracohortDiv', update, 1);

  var update = {
    xaxis: {
      //title: cond_name[curr_cond_2nd] + " > " + cond_name[curr_cond],
      tickvals: [samples[0][cond_2nd_name], samples[1][cond_2nd_name]],
      ticktext: [samples[0][cond_2nd_name] + "<br>p-value: " + mannwhitneyu.test(pval_arrays[0], pval_arrays[1], alternative = 'two-sided')["p"].toFixed(5), samples[1][cond_2nd_name] + "<br>p-value: " + mannwhitneyu.test(pval_arrays[2], pval_arrays[3], alternative = 'two-sided')["p"].toFixed(5)]
    },
    annotations: [{
      showarrow: false,
      text: "",
      x: 0.5,
      xref: 'paper',
      y: -.175,
      yref: 'paper',
      font: {
        size: 12,
        color: 'black'
      }
    }
    ]
  }
  Plotly.relayout('intracohortDiv', update)

  $("#dropdown2ndCondition").text(cond_name[cond_2nd_name]);

  $("#condition_selection").children().filter(function () {
    return $(this).text() === cond_name[curr_cond_2nd];
  }).css("display", "none");
  $("#condition_selection").children().filter(function () {
    return $(this).text() !== cond_name[curr_cond_2nd];
  }).removeAttr('style');

  if ($("#cancel_2nd").length == 0) {
    $("#button2nd_condition").prepend('<button id="cancel_2nd" type="button" onclick="clear_2nd()" class="btn btn-danger">&times;</button>');
  }

}



function clear_2nd() {

  var trace1 = {
    marker: { color: '#3D9970' },
    type: 'box',
    boxpoints: 'all',
    y: ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func],
    name: samples[0][curr_cond],
    visible: true
  };

  var trace2 = {
    marker: { color: '#FF4136' },
    type: 'box',
    boxpoints: 'all',
    y: ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func],
    name: samples[1][curr_cond],
    visible: true
  };

  var data = [trace1, trace2];

  var layout = {
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
      zeroline: false
    },
    xaxis: {
      title: 'Group'
    },
    boxmode: 'group',
    annotations: [{
      showarrow: false,
      text: "p-value: " + mannwhitneyu.test(ica_data[cond_name[curr_cond]][samples[0][curr_cond]][curr_chain][curr_func], ica_data[cond_name[curr_cond]][samples[1][curr_cond]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5),
      x: 0.5,
      xref: 'paper',
      y: -.175,
      yref: 'paper',
      font: {
        size: 12,
        color: 'black'
      }
    }
    ]
  };

  Plotly.newPlot("intracohortDiv", data, layout);

  activated_cond_2nd = false;

  $("#dropdown2ndCondition").text("Select Secondary Condition");
  $("#cancel_2nd").remove();

}
