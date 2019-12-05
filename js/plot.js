var meta_info = [];
var cond_name = [];
var cond_group = [];
var ica_data = [];
var ica_header = [];
var curr_cond = 0;
var curr_chain = "";
var curr_func = "";
var condition_2nd_x = [];
var in_chain = [];
var curr_cond_2nd = 0;
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
        meta_info[cond_name[j]] = [];
        ica_data[cond_name[j]] = [];
        var cond_groups = meta_header[j].split("|").slice(1);
        cond_group[j] = cond_group[j] || [];

        for (let k = 0; k < cond_groups.length; k++) {
          cond_group[j][k] = cond_groups[k];
          meta_info[cond_name[j]][cond_group[j][k]] = [];
          ica_data[cond_name[j]][cond_group[j][k]] = [];
        }

        if (j == (meta_header.length - 1)) {
          $(document).ready(function () {
            for (let k = 0; k < cond_name.length; k++) {
              // Populate condition options in html
              $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
              if (cond_name.length > 0) {
                if (k == 0) {
                  $("#button2nd_condition").removeAttr('style');
                }
                // Populate secondary condition options in html
                $("#condition2nd_selection").append("<a class='dropdown-item' onclick='condition_2nd(" + k + ")'>" + cond_name[k] + "</a>");
              }
              if (k == cond_name.length - 1) {
                // Hide secondary condition option which is the current primary condition
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
    // Populate available conditions
    for (let i = 0; i < meta_header.length; i++) {
      var grouping = meta_rows[j][i + 1];
      if (isNaN(grouping) == false) {
        meta_info[cond_name[i]][cond_group[i][grouping]].push(meta_rows[j][0]);
      }
    }
    // On last meta table row...
    if (j == (meta_rows.length - 1)) {

      d3.text("data/intracohort_data.csv").then(function (data) {

        var data_rows = d3.csvParseRows(data);
        ica_header = data_rows[0].slice(2);

        for (let i = 1; i < data_rows.length; i++) {
          // Collect information on which chains are included for cond_group
          in_chain[data_rows[i][1]] = in_chain[data_rows[i][1]] || [];
          in_chain[data_rows[i][1]].push(data_rows[i][0]);
          // Loop through available conditions
          for (let k = 0; k < cond_name.length; k++) {
            // Loop through condition groups
            for (let l = 0; l < cond_group[k].length; l++) {
              // if sample is in condition group...
              if (meta_info[cond_name[k]][cond_group[k][l]].includes(data_rows[i][0])) {
                // Populate if chain is undefined
                ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] || [];
                // Loop through functions and append values for sample/chain
                for (let m = 0; m < ica_header.length; m++) {
                  ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][ica_header[m]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][ica_header[m]] || [];
                  ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][ica_header[m]].push(data_rows[i][m + 2])
                }
              }
            }
            // On last data table row draw plot
            if (i == (data_rows.length - 1)) {
              $(document).ready(function () {
                curr_func = ica_header[0];
                curr_chain = Object.keys(in_chain)[0];
                $("#dropdownChain").text(curr_chain);
                $("#dropdownFunction").text(curr_func);
                dataMorph(undefined, undefined, undefined);
              });
            }
          }
          if (i == (data_rows.length - 1)) {
            $(document).ready(function () {
              // Populate function options in html
              for (let n = 0; n < ica_header.length; n++) {
                $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + ica_header[n] + "</a>");
              }
              $("#dropdownFondition").text(ica_header[curr_func]);
              // Populate chain options in html
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
  }

  var data = [];

  for (let k = 0; k < cond_group[curr_cond].length; k++) {
    // Populate trace data (Just primary condition data)
    var trace = {
      type: 'box',
      boxpoints: 'all',
      y: ica_data[cond_name[curr_cond]][cond_group[curr_cond][k]][curr_chain][curr_func],
      name: cond_group[curr_cond][k],
      visible: true
    };
    data.push(trace);
  }

  var layout = {
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
      zeroline: false
    },
    boxmode: 'group',
    xaxis: {
      // title: "p-value: " + mannwhitneyu.test(ica_data[cond_name[curr_cond]][cond_group[curr_cond][0]][curr_chain][curr_func], ica_data[cond_name[curr_cond]][cond_group[curr_cond][1]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5)
    }
  };
  // Render plot
  Plotly.newPlot("intracohortDiv", data, layout);
  // If secondary condition was already activated, rerun that function to account for change in primary condition
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

  condition_2nd_x = [];
  pval_arrays = [];

  var curr_sample = [];
  curr_y = [];
  // Loop through groups in current condition and push data for them
  for (let i = 0; i < cond_group[curr_cond].length; i++) {
    curr_sample.push(meta_info[cond_name[curr_cond]][cond_group[curr_cond][i]]);
    curr_y.push([]);
    pval_arrays.push([]);
    pval_arrays.push([]);
    condition_2nd_x.push([]);
  }

  for (let i = 0; i < curr_sample.length; i++) {
    var count = 0;
    for (let j = 0; j < curr_sample[i].length; j++) {
      var sample = curr_sample[i][j];
      var chain_included = in_chain[curr_chain].includes(sample);
      // If not included in chain, don't count
      if (chain_included == false) {
        count = count - 1;
      } else {
        // Loop through secondary condition groups
        for (let k = 0; k < cond_group[curr_cond_2nd].length; k++) {
          // If primary condition group includes sample...
          if (meta_info[cond_name[curr_cond_2nd]][cond_group[curr_cond_2nd][k]].includes(sample) && chain_included) {
            // Push corresponding x (secondary condition grouping) and y (primary condition value)
            condition_2nd_x[i].push(k);
            curr_y[i].push(ica_data[cond_name[curr_cond]][cond_group[curr_cond][i]][curr_chain][curr_func][count]);
            //pval_arrays[i].push(ica_data[cond_name[curr_cond]][cond_group[curr_cond][i]][curr_chain][curr_func][count]);
          }
        }
      }
      count = count + 1;
    }
  }
  // Update secondary gropuing
  for (let k = 0; k < condition_2nd_x.length; k++) {
    var update = {
      x: [condition_2nd_x[k]]
    }
    Plotly.restyle('intracohortDiv', update, k);
  }

  var update = {
    xaxis: {
      tickvals: Object.keys(cond_group[curr_cond_2nd]),
      ticktext: cond_group[curr_cond_2nd]
      //ticktext: [cond_group[curr_cond_2nd][0] + "<br>p-value: " + mannwhitneyu.test(pval_arrays[0], pval_arrays[1], alternative = 'two-sided')["p"].toFixed(5), cond_group[curr_cond_2nd][1] + "<br>p-value: " + mannwhitneyu.test(pval_arrays[2], pval_arrays[3], alternative = 'two-sided')["p"].toFixed(5)]
    }
  }
  Plotly.relayout('intracohortDiv', update)

  $("#dropdown2ndCondition").text(cond_name[curr_cond_2nd]);
  // Show primary conditions that aren't the same as secondary condition 
  $("#condition_selection").children().filter(function () {
    return $(this).text() === cond_name[curr_cond_2nd];
  }).css("display", "none");
  $("#condition_selection").children().filter(function () {
    return $(this).text() !== cond_name[curr_cond_2nd];
  }).removeAttr('style');
  // Display cancel button
  if ($("#cancel_2nd").length == 0) {
    $("#button2nd_condition").prepend('<button id="cancel_2nd" type="button" onclick="clear_2nd()" class="btn btn-danger">&times;</button>');
  }

}

function clear_2nd() {

  var data = [];

  for (let k = 0; k < cond_group[curr_cond].length; k++) {
    // Populate trace data (Just primary condition data)
    var trace = {
      type: 'box',
      boxpoints: 'all',
      y: ica_data[cond_name[curr_cond]][cond_group[curr_cond][k]][curr_chain][curr_func],
      name: cond_group[curr_cond][k],
      visible: true
    };
    data.push(trace)
  }

  var layout = {
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
      zeroline: false
    },
    boxmode: 'group',
    xaxis: {
      // title: "p-value: " + mannwhitneyu.test(ica_data[cond_name[curr_cond]][cond_group[curr_cond][0]][curr_chain][curr_func], ica_data[cond_name[curr_cond]][cond_group[curr_cond][1]][curr_chain][curr_func], alternative = 'two-sided')["p"].toFixed(5)
    }
  };
  // Re-render plot
  Plotly.newPlot("intracohortDiv", data, layout);

  activated_cond_2nd = false;
  // Refresh secondary condition selection
  $("#dropdown2ndCondition").text("Select Secondary Condition");
  $("#cancel_2nd").remove();
  $("#condition_selection").children().filter(function () {
    return $(this).text() == cond_name[curr_cond_2nd];
  }).removeAttr('style');

}
