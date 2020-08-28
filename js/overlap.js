var cond_name_overlap = [];
var cond_group_overlap = [];
var func_name_overlap = [];

var overlap_data = [];
var overlap_meta = [];

var curr_cond_o = "";
var curr_chain_o = "";
var curr_func_o = "";
var curr_group_o = [];

var condition_2nd_x_o = [];
var in_chain_o = [];
var curr_cond_2nd_o = "";
var curr_group_2nd_o = [];
var activated_cond_2nd_o = false;
var curr_y_o = [];
var pval_arrays_o = [];


var data_path = 'data/'
if (sessionStorage.getItem('path_val') != null) {
  data_path = sessionStorage.getItem('path_val')
} else {
  jQuery.get("cohort_list.csv", function (data) {
    var path_val = data.split("\n")[0].split(",")[0]
    path_val = path_val.replace(/\/?$/, '/');
    sessionStorage.setItem('path_val', path_val);
    data_path = sessionStorage.getItem('path_val');
    location.reload();
  }, dataType = 'text');
}


$.ajax({
  url: data_path + "overlap_meta.csv",
  type:'HEAD',
  error: function()
  {

  },
  success: function()
  {

    $(document).ready(function () {
      $('#content_ol_nav').removeAttr('style');
      $('#content_ol').removeAttr('style');
    });

    d3.text(data_path + "overlap_meta.csv").then(function (data) {

      var meta_rows = d3.csvParseRows(data);
      var meta_header = meta_rows[0].slice(1);
    
      for (let j = 1; j < meta_rows.length; j++) {
    
        if (j == 1) {
          for (let j = 0; j < meta_header.length; j++) {
            // Set up meta info and intracohort data structures
            cond_name_overlap[j] = meta_header[j].split("|")[0];
            overlap_meta[cond_name_overlap[j]] = [];
            overlap_data[cond_name_overlap[j]] = [];
            cond_group_overlap[j] = meta_header[j].split("|").slice(1);
    
            if (meta_header[j].split("|").slice(1).length == 0) {
              var group_set = [];
              for (let k = 1; k < meta_rows.length; k++) {
                var grouping = meta_rows[k][j + 1];
                if (grouping !== 'undefined' && grouping !== "NA" && grouping !== "-" && grouping !== "") {
                  group_set.push(grouping);
                }
              }
              cond_group_overlap[j] = [...new Set(group_set)].sort();
            }
    
            for (let k = 0; k < cond_group_overlap[j].length; k++) {
              overlap_meta[cond_name_overlap[j]][cond_group_overlap[j][k]] = [];
              overlap_data[cond_name_overlap[j]][cond_group_overlap[j][k]] = [];
            }
    
            if (j == (meta_header.length - 1)) {
              $(document).ready(function () {
                for (let k = 0; k < cond_name_overlap.length; k++) {
                  if (cond_name_overlap[k] != 'VisGroup') {
                    // Populate condition options in html
                    $("#condition_selection_overlap").append("<a class='dropdown-item' onclick='dataMorphOverlap(" + k + ",undefined,undefined)'>" + cond_name_overlap[k] + "</a>");
                    if (cond_name_overlap.length > 1) {
                      if (k == 0) {
                        $("#button2nd_condition_overlap").removeAttr('style');
                      }
                      // Populate secondary condition options in html
                      $("#condition2nd_selection_overlap").append("<a class='dropdown-item' onclick='condition_2nd_overlap(" + k + ")'>" + cond_name_overlap[k] + "</a>");
                    } else if (cond_name_overlap.length == 1 && k == 0) {
                      $("#button2nd_condition_overlap").remove();
                    }
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
              overlap_meta[cond_name_overlap[i]][grouping].push(meta_rows[j][0]);
            } else {
              overlap_meta[cond_name_overlap[i]][cond_group_overlap[i][grouping]].push(meta_rows[j][0]);
            }
          }
        }
        // On last meta table row...
        if (j == (meta_rows.length - 1)) {
    
          d3.text(data_path + "overlap_data.csv").then(function (data) {
    
            var data_rows = d3.csvParseRows(data);
            func_name_overlap = data_rows[0].slice(2);
    
            for (let i = 1; i < data_rows.length; i++) {
              // Collect information on which chains are included for cond_group
              in_chain_o[data_rows[i][1]] = in_chain_o[data_rows[i][1]] || [];
              in_chain_o[data_rows[i][1]].push(data_rows[i][0]);
              // Loop through available conditions
              for (let k = 0; k < cond_name_overlap.length; k++) {
                // Loop through condition groups
                for (let l = 0; l < cond_group_overlap[k].length; l++) {
                  // if sample is in condition group...
                  if (overlap_meta[cond_name_overlap[k]][cond_group_overlap[k][l]].includes(data_rows[i][0])) {
                    // Populate if chain is undefined
                    overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]] = overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]] || [];
                    // Loop through functions and append values for sample/chain
                    for (let m = 0; m < func_name_overlap.length; m++) {
                      if (cond_name_overlap[k] == 'VisGroup'){
                        overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]] = overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]] || [null,null];
                        if (overlap_meta["Timepoint"]["Pre"].includes(data_rows[i][0])) {
                        overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]][0] = data_rows[i][m + 2]
                        } else if (overlap_meta["Timepoint"]["Post"].includes(data_rows[i][0])){
                          overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]][1] = data_rows[i][m + 2]                      
                        }
                      } else {
                      overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]] = overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]] || [];
                      overlap_data[cond_name_overlap[k]][cond_group_overlap[k][l]][data_rows[i][1]][func_name_overlap[m]].push(data_rows[i][m + 2])
                      }
    
                    }
                  }
                }
                // On last data table row draw plot
                if (i == (data_rows.length - 1)) {
                  $(document).ready(function () {
                    curr_func_o = func_name_overlap[0];
                    curr_chain_o = Object.keys(in_chain_o)[0];
                    curr_cond_o = cond_name_overlap[0];
                    curr_group_o = cond_group_overlap[0];
                    $("#dropdownChainOverlap").text(curr_chain_o);
                    $("#dropdownFunctionOverlap").text(curr_func_o);
                    $("#dropdownConditionOverlap").text(curr_cond_o);
                    $('#cond_buttons_overlap').removeAttr('style');
                    // Hide secondary condition option which is the current primary condition
                    $("#condition2nd_selection_overlap").children().filter(function () {
                      return $(this).text() === curr_cond_o;
                    }).css("display", "none");
                    dataMorphOverlap();
                  });
                }
              }
              if (i == (data_rows.length - 1)) {
                $(document).ready(function () {
                  // Populate function options in html
                  for (let n = 0; n < func_name_overlap.length; n++) {
                    $("#function_selection_overlap").append("<a class='dropdown-item' onclick='dataMorphOverlap(undefined,undefined," + n + ")'>" + func_name_overlap[n] + "</a>");
                  }
                  $("#dropdownFonditionOverlap").text(func_name_overlap[curr_func_o]);
                  // Populate chain options in html
                  var available_chains = Object.keys(in_chain_o).sort();
                  for (let n = 0; n < available_chains.length; n++) {
                    $("#chain_selection_overlap").append("<a class='dropdown-item' onclick='dataMorphOverlap(undefined, &quot;" + available_chains[n] + "&quot;,undefined)'>" + available_chains[n] + "</a>");
                  }
                });
              }
            }
          })
        }
      }
    })
    
  }
});

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

function dataMorphOverlap(cond, chain, func) {
  // Condition change
  if (typeof cond != "undefined") {
    curr_cond_o = cond_name_overlap[cond];
    curr_group_o = cond_group_overlap[cond];
    $("#dropdownConditionOverlap").text(curr_cond_o);
    $("#condition2nd_selection_overlap").children().filter(function () {
      return $(this).text() === curr_cond_o;
    }).css("display", "none");
    $("#condition2nd_selection_overlap").children().filter(function () {
      return $(this).text() !== curr_cond_o;
    }).removeAttr('style');
  }
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain_o = chain;
    $("#dropdownChainOverlap").text(curr_chain_o);
  }
  // Function change
  if (typeof func != "undefined") {
    curr_func_o = func_name_overlap[func];
    $("#dropdownFunctionOverlap").text(curr_func_o);
  }

  draw_traces_overlap();
  // If secondary condition was already activated, rerun that function to account for change in primary condition
  if (activated_cond_2nd_o == true) {
    condition_2nd_overlap();
  }

}

function condition_2nd_overlap(cond_2nd_idx) {

  if (typeof cond_2nd_idx != "undefined") {
    curr_cond_2nd_o = cond_name_overlap[cond_2nd_idx];
    curr_group_2nd_o = cond_group_overlap[cond_2nd_idx];
  }

  activated_cond_2nd_o = true;

  condition_2nd_x_o = [];
  var curr_sample = [];
  curr_y_o = [];

  if (curr_group_o.length == 2) {
    pval_arrays_o = [[], []];
  }
  // Loop through groups in current condition and push data for them
  for (let i = 0; i < curr_group_o.length; i++) {
    curr_sample.push(overlap_meta[curr_cond_o][curr_group_o[i]]);
    curr_y_o.push([]);
    condition_2nd_x_o.push([]);
  }

  for (let i = 0; i < curr_sample.length; i++) {
    var skip = 0;
    for (let j = 0; j < curr_sample[i].length; j++) {
      var sample = curr_sample[i][j];
      var chain_included = in_chain_o[curr_chain_o].includes(sample);
      // If not included in chain, don't count
      if (chain_included == false) {
        skip = skip + 1;
      } else {
        // Loop through secondary condition groups
        for (let k = 0; k < curr_group_2nd_o.length; k++) {
          // If primary condition group includes sample...
          if (overlap_meta[curr_cond_2nd_o][curr_group_2nd_o[k]].includes(sample)) {
            // Push corresponding x (secondary condition grouping) and y (primary condition value)
            condition_2nd_x_o[i].push(k);
            curr_y_o[i].push(overlap_data[curr_cond_o][curr_group_o[i]][curr_chain_o][curr_func_o][j - skip]);
            if (curr_group_o.length == 2) {
              pval_arrays_o[i][k] = pval_arrays_o[i][k] || [];
              pval_arrays_o[i][k].push(overlap_data[curr_cond_o][curr_group_o[i]][curr_chain_o][curr_func_o][j - skip]);
            }
          }
        }
      }
    }
  }

  var x_text = [];

  if (curr_group_o.length == 2) {
    for (let k = 0; k < curr_group_2nd_o.length; k++) {
      if (typeof pval_arrays_o[0][k] !== 'undefined' && typeof pval_arrays_o[1][k] !== 'undefined') {
        x_text.push(curr_group_2nd_o[k] + "<br>p-value: " + mannwhitneyu.test(pval_arrays_o[0][k], pval_arrays_o[1][k], alternative = 'two-sided')["p"].toFixed(5));
      } else { x_text.push(curr_group_2nd_o[k]); }
    }
  } else { x_text = curr_group_2nd_o };

  k_count = 0;
  // Populate available traces
  for (let k = 0; k < condition_2nd_x_o.length; k++) {
    if (condition_2nd_x_o[k].length > 0) {
      var update = {
        x: [condition_2nd_x_o[k]],
        y: [curr_y_o[k]]
      }
      Plotly.restyle('overlapDiv', update, k_count);
      k_count = k_count + 1;
    }
  }
  // Delete extra remaining traces
  for (let k = k_count; k < overlapDiv.data.length; k++) {  
    Plotly.deleteTraces('overlapDiv', k_count);
  }

  var update = {
    xaxis: {
      tickvals: Object.keys(curr_group_2nd_o),
      ticktext: x_text
    },
    annotations: []
  }
  Plotly.relayout('overlapDiv', update)

  $("#dropdown2ndConditionOverlap").text(curr_cond_2nd_o);
  // Show primary conditions that aren't the same as secondary condition 
  $("#condition_selection_overlap").children().filter(function () {
    return $(this).text() === curr_cond_2nd_o;
  }).css("display", "none");
  $("#condition_selection_overlap").children().filter(function () {
    return $(this).text() !== curr_cond_2nd_o;
  }).removeAttr('style');
  // Display cancel button
  if ($("#cancel_2nd_overlap").length == 0) {
    $("#button2nd_condition_overlap").prepend('<button id="cancel_2nd_overlap" type="button" onclick="clear_2nd_overlap()" class="btn btn-danger">&times;</button>');
    $("#button2nd_condition_overlap").prepend('<button id="swap_2nd_overlap" type="button" onclick="swap_conds_overlap()" class="btn btn-warning">&UpArrowDownArrow;</button>');
  }

}

function clear_2nd_overlap() {

  draw_traces_overlap();

  activated_cond_2nd_o = false;
  // Refresh secondary condition selection
  $("#dropdown2ndConditionOverlap").text("Select Secondary Condition");
  $("#cancel_2nd_overlap").remove();
  $("#swap_2nd_overlap").remove();
  $("#condition_selection_overlap").children().filter(function () {
    return $(this).text() == curr_cond_2nd_o;
  }).removeAttr('style');

}

function swap_conds_overlap() {

  new_2nd = cond_name_overlap.indexOf(curr_cond_o);
  dataMorphOverlap(cond_name_overlap.indexOf(curr_cond_2nd_o), undefined, undefined);
  condition_2nd_overlap(new_2nd);

}

function draw_traces_overlap() {

  var data = [];
  var pvals = [];

  for (let k = 0; k < curr_group_o.length; k++) {
    // Populate trace data (Just primary condition data)
    if (typeof overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o] !== 'undefined') {
      var trace = {
        type: 'box',
        boxpoints: 'all',
        y: overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o],
        x: Array(overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o].length).fill(k),
        name: curr_group_o[k],
        visible: true
      };
      data.push(trace);
    }
    // p-value annotation
    if (k < curr_group_o.length - 1) {
      if (typeof overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o] !== 'undefined' && typeof overlap_data[curr_cond_o][curr_group_o[k + 1]][curr_chain_o] !== 'undefined') {
        if (typeof overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o] !== 'undefined' && typeof overlap_data[curr_cond_o][curr_group_o[k + 1]][curr_chain_o][curr_func_o] !== 'undefined') {
          var the_pval = "p-value:<br>" + mannwhitneyu.test(overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o], overlap_data[curr_cond_o][curr_group_o[k + 1]][curr_chain_o][curr_func_o], alternative = 'two-sided')["p"].toFixed(5);
        }
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
    title: 'Overlap Analysis',
    yaxis: {
      title: curr_func_o,
      zeroline: false
    },
    boxmode: 'group',
    xaxis: {
      tickvals: Object.keys(curr_group_o),
      ticktext: curr_group_o
    },
    annotations: pvals,
    showlegend: true
  };
  // Render plot
  Plotly.newPlot("overlapDiv", data, layout);
  // Hide p-vals of hidden traces
  var pval_vis = Array(curr_group_o.length).fill(true);
  $('.legendtoggle').on('click', function () {
    if (activated_cond_2nd_o == false) {
      pval_vis[$(this).parent().index()] = !(pval_vis[$(this).parent().index()]);
      var pvals = [];
      for (let k = 0; k < pval_vis.length - 1; k++) {
        if (pval_vis[k] == true && pval_vis[k + 1] == true) {
          if (typeof overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o] !== 'undefined' && typeof overlap_data[curr_cond_o][curr_group_o[k + 1]][curr_chain_o][curr_func_o] !== 'undefined') {
            var the_pval = "p-value:<br>" + mannwhitneyu.test(overlap_data[curr_cond_o][curr_group_o[k]][curr_chain_o][curr_func_o], overlap_data[curr_cond_o][curr_group_o[k + 1]][curr_chain_o][curr_func_o], alternative = 'two-sided')["p"].toFixed(5);
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
      Plotly.relayout('overlapDiv', update);
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

$(document).ready(function () {


  $('.imageEmbed').attr("src", function () { return data_path + $(this).attr("id") });
  $(".imageEmbed").on("load", function () {
    $('.static').removeAttr('style');
  });
});


