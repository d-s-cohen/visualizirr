var cond_name = [];
var cond_group = [];
var func_name = [];

var ica_data = [];
var ica_meta = [];

var curr_cond = "";
var curr_chain = "";
var curr_func = "";
var curr_group = [];

var condition_2nd_x = [];
var in_chain = [];
var curr_cond_2nd = "";
var curr_group_2nd = [];
var activated_cond_2nd = false;
var curr_y = [];
var pval_arrays = [];

d3.text("data/meta.csv").then(function (data) {

  var meta_rows = d3.csvParseRows(data);
  var meta_header = meta_rows[0].slice(1);

  for (let j = 1; j < meta_rows.length; j++) {

    if (j == 1) {
      for (let j = 0; j < meta_header.length; j++) {
        // Set up meta info and intracohort data structures
        cond_name[j] = meta_header[j].split("|")[0];
        ica_meta[cond_name[j]] = [];
        ica_data[cond_name[j]] = [];
        cond_group[j] = meta_header[j].split("|").slice(1);

        if (meta_header[j].split("|").slice(1).length == 0) {
          var group_set = [];
          for (let k = 1; k < meta_rows.length; k++) {
            var grouping = meta_rows[k][j + 1];
            if (grouping !== 'undefined' && grouping !== "NA" && grouping !== "-" && grouping !== "") {
              group_set.push(grouping);
            }
          }
          cond_group[j] = [...new Set(group_set)].sort();
        }

        for (let k = 0; k < cond_group[j].length; k++) {
          ica_meta[cond_name[j]][cond_group[j][k]] = [];
          ica_data[cond_name[j]][cond_group[j][k]] = [];
        }

        if (j == (meta_header.length - 1)) {
          $(document).ready(function () {
            for (let k = 0; k < cond_name.length; k++) {
              // Populate condition options in html
              $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
              if (cond_name.length > 1) {
                if (k == 0) {
                  $("#button2nd_condition").removeAttr('style');
                }
                // Populate secondary condition options in html
                $("#condition2nd_selection").append("<a class='dropdown-item' onclick='condition_2nd(" + k + ")'>" + cond_name[k] + "</a>");
              } else if (cond_name.length == 1 && k == 0) {
                $("#button2nd_condition").remove();
              }
              if (k == cond_name.length - 1) {
                // Hide secondary condition option which is the current primary condition
                $("#condition2nd_selection").children().filter(function () {
                  return $(this).text() === curr_cond;
                }).css("display", "none");
              }
            }
          });
        }
      }
    }
    // Populate available conditions
    for (let i = 0; i < meta_header.length; i++) {
      var grouping = meta_rows[j][i + 1];
      if (typeof grouping !== 'undefined' && grouping !== "NA" && grouping !== "-" && grouping !== "") {
        if (meta_header[i].split("|").slice(1).length == 0) {
          ica_meta[cond_name[i]][grouping].push(meta_rows[j][0]);
        } else {
          ica_meta[cond_name[i]][cond_group[i][grouping]].push(meta_rows[j][0]);
        }
      }
    }
    // On last meta table row...
    if (j == (meta_rows.length - 1)) {

      d3.text("data/intracohort_data.csv").then(function (data) {

        var data_rows = d3.csvParseRows(data);
        func_name = data_rows[0].slice(2);

        for (let i = 1; i < data_rows.length; i++) {
          // Collect information on which chains are included for cond_group
          in_chain[data_rows[i][1]] = in_chain[data_rows[i][1]] || [];
          in_chain[data_rows[i][1]].push(data_rows[i][0]);
          // Loop through available conditions
          for (let k = 0; k < cond_name.length; k++) {
            // Loop through condition groups
            for (let l = 0; l < cond_group[k].length; l++) {
              // if sample is in condition group...
              if (ica_meta[cond_name[k]][cond_group[k][l]].includes(data_rows[i][0])) {
                // Populate if chain is undefined
                ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] || [];
                // Loop through functions and append values for sample/chain
                for (let m = 0; m < func_name.length; m++) {
                  ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] || [];
                  ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]].push(data_rows[i][m + 2])
                }
              }
            }
            // On last data table row draw plot
            if (i == (data_rows.length - 1)) {
              $(document).ready(function () {
                curr_func = func_name[0];
                curr_chain = Object.keys(in_chain)[0];
                curr_cond = cond_name[0];
                curr_group = cond_group[0];
                $("#dropdownChain").text(curr_chain);
                $("#dropdownFunction").text(curr_func);
                $("#dropdownCondition").text(curr_cond);
                dataMorph();
              });
            }
          }
          if (i == (data_rows.length - 1)) {
            $(document).ready(function () {
              // Populate function options in html
              for (let n = 0; n < func_name.length; n++) {
                $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
              }
              $("#dropdownFondition").text(func_name[curr_func]);
              // Populate chain options in html
              var available_chains = Object.keys(in_chain).sort();
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
});

function dataMorph(cond, chain, func) {
  // Condition change
  if (typeof cond != "undefined") {
    curr_cond = cond_name[cond];
    curr_group = cond_group[cond];
    $("#dropdownCondition").text(curr_cond);
    $("#condition2nd_selection").children().filter(function () {
      return $(this).text() === curr_cond;
    }).css("display", "none");
    $("#condition2nd_selection").children().filter(function () {
      return $(this).text() !== curr_cond;
    }).removeAttr('style');
  }
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain = chain;
    $("#dropdownChain").text(curr_chain);
  }
  // Function change
  if (typeof func != "undefined") {
    curr_func = func_name[func];
    $("#dropdownFunction").text(curr_func);
  }

  draw_traces();
  // If secondary condition was already activated, rerun that function to account for change in primary condition
  if (activated_cond_2nd == true) {
    condition_2nd();
  }

}

function condition_2nd(cond_2nd_idx) {

  if (typeof cond_2nd_idx != "undefined") {
    curr_cond_2nd = cond_name[cond_2nd_idx];
    curr_group_2nd = cond_group[cond_2nd_idx];
  }

  activated_cond_2nd = true;

  condition_2nd_x = [];
  var curr_sample = [];
  curr_y = [];

  if (curr_group.length == 2) {
    pval_arrays = [[], []];
  }
  // Loop through groups in current condition and push data for them
  for (let i = 0; i < curr_group.length; i++) {
    curr_sample.push(ica_meta[curr_cond][curr_group[i]]);
    curr_y.push([]);
    condition_2nd_x.push([]);
  }

  for (let i = 0; i < curr_sample.length; i++) {
    var skip = 0;
    for (let j = 0; j < curr_sample[i].length; j++) {
      var sample = curr_sample[i][j];
      var chain_included = in_chain[curr_chain].includes(sample);
      // If not included in chain, don't count
      if (chain_included == false) {
        skip = skip + 1;
      } else {
        // Loop through secondary condition groups
        for (let k = 0; k < curr_group_2nd.length; k++) {
          // If primary condition group includes sample...
          if (ica_meta[curr_cond_2nd][curr_group_2nd[k]].includes(sample)) {
            // Push corresponding x (secondary condition grouping) and y (primary condition value)
            condition_2nd_x[i].push(k);
            curr_y[i].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j - skip]);
            if (curr_group.length == 2) {
              pval_arrays[i][k] = pval_arrays[i][k] || [];
              pval_arrays[i][k].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j - skip]);
            }
          }
        }
      }
    }
  }

  var x_text = [];

  if (curr_group.length == 2) {
    for (let k = 0; k < curr_group_2nd.length; k++) {
      if (typeof pval_arrays[0][k] !== 'undefined' && typeof pval_arrays[1][k] !== 'undefined') {
        x_text.push(curr_group_2nd[k] + "<br>p-value: " + mannwhitneyu.test(pval_arrays[0][k], pval_arrays[1][k], alternative = 'two-sided')["p"].toFixed(5));
      } else { x_text.push(curr_group_2nd[k]); }
    }
  } else { x_text = curr_group_2nd };

  for (let k = 0; k < condition_2nd_x.length; k++) {
    var update = {
      x: [condition_2nd_x[k]],
      y: [curr_y[k]]
    }
    Plotly.restyle('intracohortDiv', update, k);
  }

  var update = {
    xaxis: {
      tickvals: Object.keys(curr_group_2nd),
      ticktext: x_text
    },
    annotations: []
  }
  Plotly.relayout('intracohortDiv', update)

  $("#dropdown2ndCondition").text(curr_cond_2nd);
  // Show primary conditions that aren't the same as secondary condition 
  $("#condition_selection").children().filter(function () {
    return $(this).text() === curr_cond_2nd;
  }).css("display", "none");
  $("#condition_selection").children().filter(function () {
    return $(this).text() !== curr_cond_2nd;
  }).removeAttr('style');
  // Display cancel button
  if ($("#cancel_2nd").length == 0) {
    $("#button2nd_condition").prepend('<button id="cancel_2nd" type="button" onclick="clear_2nd()" class="btn btn-danger">&times;</button>');
  }

}

function clear_2nd() {

  draw_traces();

  activated_cond_2nd = false;
  // Refresh secondary condition selection
  $("#dropdown2ndCondition").text("Select Secondary Condition");
  $("#cancel_2nd").remove();
  $("#condition_selection").children().filter(function () {
    return $(this).text() == curr_cond_2nd;
  }).removeAttr('style');

}

function draw_traces() {

  var data = [];
  var pvals = [];

  for (let k = 0; k < curr_group.length; k++) {
    // Populate trace data (Just primary condition data)
    var trace = {
      type: 'box',
      boxpoints: 'all',
      y: ica_data[curr_cond][curr_group[k]][curr_chain][curr_func],
      x: Array(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].length).fill(k),
      name: curr_group[k],
      visible: true
    };
    data.push(trace);
    // p-value annotation
    if (k < curr_group.length - 1) {
      if (typeof ica_data[curr_cond][curr_group[k]][curr_chain][curr_func] !== 'undefined' && typeof ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func] !== 'undefined') {
        var the_pval = "p-value:<br>" + mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func], ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5);
      } else { var the_pval = ""; }
      var anno = {
        showarrow: false,
        text: the_pval,
        x: k + .5,
        xref: 'x',
        y: -.175,
        yref: 'paper',
        font: {
          size: 12,
          color: 'black'
        },
      }
      pvals.push(anno);
    }
  }
  // Plot layout
  var layout = {
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
      zeroline: false
    },
    boxmode: 'group',
    xaxis: {
      tickvals: Object.keys(curr_group),
      ticktext: curr_group
    },
    annotations: pvals
  };
  // Render plot
  Plotly.newPlot("intracohortDiv", data, layout);
  // Hide p-vals of hidden traces
  var pval_vis = Array(curr_group.length).fill(true);
  $('.legendtoggle').on('click', function () {
    if (activated_cond_2nd == false) {
      pval_vis[$(this).parent().index()] = !(pval_vis[$(this).parent().index()]);
      var pvals = [];
      for (let k = 0; k < pval_vis.length - 1; k++) {
        if (pval_vis[k] == true && pval_vis[k + 1] == true) {
          if (typeof ica_data[curr_cond][curr_group[k]][curr_chain][curr_func] !== 'undefined' && typeof ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func] !== 'undefined') {
            var the_pval = "p-value:<br>" + mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func], ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5);
          } else { var the_pval = ""; }
          var anno = {
            showarrow: false,
            text: the_pval,
            x: k + .5,
            xref: 'x',
            y: -.175,
            yref: 'paper',
            font: {
              size: 12,
              color: 'black'
            },
          }
          pvals.push(anno);
        }
      }
      var update = { annotations: pvals };
      Plotly.relayout('intracohortDiv', update);
    }
  })
}
// Make plot visible or invisible
function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}
