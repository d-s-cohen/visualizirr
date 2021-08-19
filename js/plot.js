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
var curr_sample = [];
var curr_sample_sub = [];

var pair_split = ""

var timepoint_group = [];
var pair_group = [];

var timepoint_group_original = [];

var curr_chain_psca = "";
var curr_func_psca = "";
var curr_split_psca = "psca_allsamples";

var curr_x_scatter = "";
var curr_y_scatter = "";
var curr_chain_scatter = "";

var sample_list = [];

var ica_meta_ordered = [];

var plot_type = 'box';

var pToggle = false;

var z_vals =[];
var z_vals_cond = [];
var z_vals_2nd = [];
var primary_cond_heatmap = [];
var secondary_cond_heatmap = [];

var z_vals_pair=[[]];
var xlab_pair=[];
var timepoint_colorbar=[];

var paired_sample_split = false

var color_codes = [
  '#1f77b4',  // muted blue
  '#ff7f0e',  // safety orange
  '#2ca02c',  // cooked asparagus green
  '#d62728',  // brick red
  '#9467bd',  // muted purple
  '#8c564b',  // chestnut brown
  '#e377c2',  // raspberry yogurt pink
  '#7f7f7f',  // middle gray
  '#bcbd22',  // curry yellow-green
  '#17becf'   // blue-teal
];
var curr_color_codes = [];
var curr_color_codes_paired = [];


var color_codes_2nd = [
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd"
];
var curr_color_codes_2nd = [];
var curr_color_codes_2nd_paired = [];

var cohort_name_intra = 'Intracohort Analysis'
var cohort_name_pair = 'Paired Sample Cohort Analysis'
var cohort_name_scatter = 'Intracohort Scatterplot'

var data_sheet = {};
data_sheet[null] = 'intracohort_data.csv';
data_sheet['db'] = 'db_data.csv';
var data_sheet_url = data_sheet[new URL(location.href).searchParams.get('data')];

var heat_vals = {};
heat_vals[NaN] = 0;
heat_vals[-Infinity] = -2;
heat_vals[Infinity] = 2;

if (sessionStorage.getItem('path_val') != "data/" && sessionStorage.getItem('path_val') != null) {
  cohort_name_intra = sessionStorage.getItem('path_val').split("/")[sessionStorage.getItem('path_val').split("/").length - 2];
  cohort_name_pair = sessionStorage.getItem('path_val').split("/")[sessionStorage.getItem('path_val').split("/").length - 2];
  cohort_name_scatter = sessionStorage.getItem('path_val').split("/")[sessionStorage.getItem('path_val').split("/").length - 2];
}

$(document).ready(function () {
  pToggle = $("#p-switch").is(':checked');
});

let checker = (arr, target) => target.every(v => arr.includes(v));

function toExp(x) {
  //if (x < .01) {
  x = x.toExponential(1)
  //} else {
  //  x = x.toFixed(3)
  //}
  return x;
}

function log2fc (x,y) {
  log2fc_val = Math.log2(y/x);
  if ((![NaN,-Infinity,Infinity].includes(log2fc_val))){
    return log2fc_val;
  } else {
    return heat_vals[log2fc_val];
  }
}

const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const quantile = (arr, q) => {
  const sorted = arr.sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
      return sorted[base];
  }
};

const q25 = arr => quantile(arr, .25);
const q50 = arr => quantile(arr, .50);
const q75 = arr => quantile(arr, .75);

function normalize(med,iqr) {
  return function (val) {
    norm_val = ((val - med) / iqr)
    if ((![NaN,-Infinity,Infinity].includes(norm_val))){
      return norm_val;
    } else {
      return heat_vals[norm_val];
    }
  };
}


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

var current_samples = [];
// $.ajax({
//   url: data_path + "meta.csv",
//   type: 'HEAD',
//   success: function () {
//     d3.text(data_path + "meta.csv").then(function (data) {

//       var meta_rows = d3.csvParseRows(data);
//       for (let j = 1; j < meta_rows.length; j++) {
//         current_samples.push(meta_rows[j][0]);
//       }
//     })
//   }
// });

function populate_page() {
$.ajax({
  url: data_path + "meta.csv",
  type: 'HEAD',
  error: function () {
    d3.text(data_path + data_sheet_url).then(function (data) {

      cond_name[0] = "no_cond_cond";
      cond_group[0] = [];
      cond_group[0][0] = "All Samples";
      ica_meta[cond_name[0]] = [];
      ica_data[cond_name[0]] = [];
      ica_meta[cond_name[0]][cond_group[0]] = [];
      ica_data[cond_name[0]][cond_group[0]] = [];

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
            // Populate if chain is undefined
            ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] || [];
            // Loop through functions and append values for sample/chain
            for (let m = 0; m < func_name.length; m++) {
              ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] || [];
              ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]].push(data_rows[i][m + 2])
            }
          }
          // On last data table row draw plot
          if ((i == (data_rows.length - 1)) && k == (cond_name.length - 1)) {

            $(document).ready(function () {
              curr_func = func_name[0];
              curr_chain = Object.keys(in_chain)[0];
              curr_cond = cond_name[0];
              curr_func_psca = func_name[0];
              curr_chain_psca = Object.keys(in_chain)[0];
              curr_group = cond_group[0];
              curr_chain_scatter = Object.keys(in_chain)[0];
              curr_x_scatter = func_name[0];
              curr_y_scatter = func_name[0];
              $("#dropdownChain").text(curr_chain);
              $("#dropdownFunction").text(curr_func);
              $("#dropdownCondition").text(curr_cond);
              $("#dropdownChainPSCA").text(curr_chain_psca);
              $("#dropdownFunctionPSCA").text(curr_func_psca);
              $("#dropdownChainScatter").text(curr_chain_scatter);
              $("#dropdownXScatter").text("x: " + curr_x_scatter);
              $("#dropdownYScatter").text("y: " + curr_y_scatter);
              // Hide secondary condition option which is the current primary condition
              $("#condition2nd_selection").children().filter(function () {
                return $(this).text() === curr_cond;
              }).css("display", "none");
              dataMorph();
              if (cond_name.includes('VisGroup')) {
                $('#content_PSCA').removeAttr('style');
                $('#content_psca_nav').removeAttr('style');
                pscaDraw();
              }
              all_data = ica_data['no_cond_cond']['All Samples']
              scatterDraw();
            });
          }
        }
        if (i == (data_rows.length - 1)) {
          $(document).ready(function () {
            // Populate function options in html
            for (let n = 0; n < func_name.length; n++) {
              $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
              $("#function_selection_psca").append("<a class='dropdown-item' onclick='dataMorphPSCA(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
              $("#x_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(undefined," + n + ",undefined)'>" + func_name[n] + "</a>");
              $("#y_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
            }
            // Populate chain options in html
            var available_chains = Object.keys(in_chain).sort();
            for (let n = 0; n < available_chains.length; n++) {
              $("#chain_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined, &quot;" + available_chains[n] + "&quot;,undefined)'>" + available_chains[n] + "</a>");
              $("#chain_selection_psca").append("<a class='dropdown-item' onclick='dataMorphPSCA(undefined,&quot;" + available_chains[n] + "&quot;,undefined)'>" + available_chains[n] + "</a>");
              $("#chain_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(&quot;" + available_chains[n] + "&quot;,undefined,undefined)'>" + available_chains[n] + "</a>");
            }
          });
        }
      }
    })
  },
  success: function () {

    ica_data = [];
    ica_meta = [];
    ica_meta_ordered = [];

    d3.text(data_path + "meta.csv").then(function (data) {

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
                $("#condition_selection").empty();
                $("#condition2nd_selection").empty();
                $("#split_selection_psca").empty();
                $("#split_selection_psca").append("<a class='dropdown-item' onclick=dataMorphPSCA(undefined,'none',undefined)>No Split</a>");
                for (let k = 0; k < cond_name.length; k++) {
                  if (cond_name[k] != 'VisGroup') {
                    // Populate condition options in html
                    $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
                    if (cond_name[k] != 'Timepoint') {
                      $("#split_selection_psca").append("<a class='dropdown-item' onclick='dataMorphPSCA(undefined," + k + ",undefined)'>" + cond_name[k] + "</a>");
                    }
                    if (cond_name.filter(e => e !== 'VisGroup').length > 1) {
                      if (k == 0) {
                        $("#button2nd_condition").removeAttr('style');
                      }
                      // Populate secondary condition options in html
                      $("#condition2nd_selection").append("<a class='dropdown-item' onclick='condition_2nd(" + k + ")'>" + cond_name[k] + "</a>");
                    } else if (cond_name.filter(e => e !== 'VisGroup').length == 1 && k == 0) {
                      $("#button2nd_condition").remove();
                    }
                  } else {
                    ica_meta["psca_allsamples"] = [];
                    ica_meta["psca_allsamples"][" "] = meta_rows.slice(1).map(function (x) { return x[0]; });
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
            if (checkAvailability(current_samples, meta_rows[j][0])) {
              if (meta_header[i].split("|").slice(1).length == 0) {
                ica_meta[cond_name[i]][grouping].push(meta_rows[j][0]);
              } else {
                ica_meta[cond_name[i]][cond_group[i][grouping]].push(meta_rows[j][0]);
              }
          }
          }
        }
        // On last meta table row...
        if (j == (meta_rows.length - 1)) {

          d3.text(data_path + data_sheet_url).then(function (data) {

            var data_rows = d3.csvParseRows(data);
            func_name = data_rows[0].slice(2);
            all_data = [];

            for (let i = 1; i < data_rows.length; i++) {
             if (checkAvailability(current_samples, data_rows[i][0])) {
              // Collect information on which chains are included for cond_group
              in_chain[data_rows[i][1]] = in_chain[data_rows[i][1]] || [];
              in_chain[data_rows[i][1]].push(data_rows[i][0]);

              all_data[data_rows[i][1]] = all_data[data_rows[i][1]] || [];
              for (let m = 0; m < func_name.length; m++) {
                all_data[data_rows[i][1]][func_name[m]] = all_data[data_rows[i][1]][func_name[m]] || [];
                all_data[data_rows[i][1]][func_name[m]].push(data_rows[i][m + 2])
              }
            }


              // Loop through available conditions
              for (let k = 0; k < cond_name.length; k++) {
                // Loop through condition groups
                if (checkAvailability(current_samples, data_rows[i][0])) {
                for (let l = 0; l < cond_group[k].length; l++) {
                  // if sample is in condition group...
                  if (ica_meta[cond_name[k]][cond_group[k][l]].includes(data_rows[i][0])) {

                    ica_meta_ordered[cond_name[k]] = ica_meta_ordered[cond_name[k]] || [];
                    ica_meta_ordered[cond_name[k]][cond_group[k][l]] = ica_meta_ordered[cond_name[k]][cond_group[k][l]] || [];
                    ica_meta_ordered[cond_name[k]][cond_group[k][l]][data_rows[i][1]] = ica_meta_ordered[cond_name[k]][cond_group[k][l]][data_rows[i][1]] || [];

                    ica_meta_ordered[cond_name[k]][cond_group[k][l]][data_rows[i][1]].push(data_rows[i][0])
                    // Populate if chain is undefined
                    ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]] || [];

                    // Loop through functions and append values for sample/chain
                    for (let m = 0; m < func_name.length; m++) {
                      if (cond_name[k] == 'VisGroup') {
                        if (Object.keys(ica_meta).includes("Timepoint")) {
                          pair_split = "Timepoint";
                        } else {
                          if (Object.keys(ica_meta)[0] == 'VisGroup') {
                            pair_split = Object.keys(ica_meta)[1];
                          } else {
                            pair_split = Object.keys(ica_meta)[0];
                          }
                        }
                        pair_groups = Object.keys(ica_meta[pair_split])
                        ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] || Array.from(Array(pair_groups.length), () => null);;
                        for (let n = 0; n < pair_groups.length; n++) {
                          if (ica_meta[pair_split][pair_groups[n]].includes(data_rows[i][0])) {
                            ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]][n] = data_rows[i][m + 2]
                          }
                        }
                      } else {
                        ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] = ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]] || [];
                        ica_data[cond_name[k]][cond_group[k][l]][data_rows[i][1]][func_name[m]].push(data_rows[i][m + 2])

                      }

                    }
                  }
                }
              }
                // On last data table row draw plot
                if ((i == (data_rows.length - 1)) && k == (cond_name.length - 1)) {

                  for (let l = 0; l < cond_name.length; l++) {
                    if (typeof ica_meta_ordered[cond_name[l]] != "undefined") {
                      if (cond_name[l] == 'Timepoint') {timepoint_group_original = cond_group[l];}
                      cond_group[l] = Object.keys(ica_meta_ordered[cond_name[l]]).sort(function(a, b){  
                        return cond_group[l].indexOf(a) - cond_group[l].indexOf(b);
                      }); 
                    }
                  }

                  $(document).ready(function () {
                    if (curr_func == "") {
                      curr_func = func_name[0];
                    }
                    if (curr_chain == "") {
                      curr_chain = Object.keys(in_chain)[0];
                    }
                    if (curr_cond == "") {
                      if (cond_name[0] == 'VisGroup') {
                        curr_cond = cond_name[1];
                      } else {
                        curr_cond = cond_name[0];
                      }
                    }       
                    curr_group = cond_group[cond_name.indexOf(curr_cond)]

                    if (curr_func_psca == "") {
                      curr_func_psca = func_name[0];
                    }
                    if (curr_chain_psca == "") {
                      curr_chain_psca = Object.keys(in_chain)[0];
                    }
                    if (curr_chain_scatter == "") {
                      curr_chain_scatter = Object.keys(in_chain)[0];
                    }
                    if (curr_x_scatter == "") {
                      curr_x_scatter = func_name[0];
                    }
                    if (curr_y_scatter == "") {
                      curr_y_scatter = func_name[0];
                    }
                    $("#dropdownChain").text(curr_chain);
                    $("#dropdownFunction").text(curr_func);
                    $("#dropdownCondition").text(curr_cond);
                    $("#dropdownChainPSCA").text(curr_chain_psca);
                    $("#dropdownFunctionPSCA").text(curr_func_psca);
                    $("#dropdownChainScatter").text(curr_chain_scatter);
                    $("#dropdownXScatter").text("x: " + curr_x_scatter);
                    $("#dropdownYScatter").text("y: " + curr_y_scatter);
                    $('#cond_buttons').removeAttr('style');
                    // Hide secondary condition option which is the current primary condition
                    $("#condition2nd_selection").children().filter(function () {
                      return $(this).text() === curr_cond;
                    }).css("display", "none");
                    dataMorph();
                    if (cond_name.includes('VisGroup') && cond_name.includes('Timepoint')) {
                      $('#content_PSCA').removeAttr('style');
                      $('#content_psca_nav').removeAttr('style');
                      pscaDraw();
                      draw_paired_heatmap();
                    }
                    scatterDraw();
                  });
                }
              }
              if (i == (data_rows.length - 1)) {
                $(document).ready(function () {
                  $("#function_selection").empty();
                  $("#function_selection_psca").empty();
                  $("#x_selection_scatter").empty();
                  $("#y_selection_scatter").empty();
                  $("#chain_selection").empty();
                  $("#chain_selection_psca").empty();
                  $("#chain_selection_scatter").empty();
                  // Populate function options in html
                  for (let n = 0; n < func_name.length; n++) {
                    $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
                    $("#function_selection_psca").append("<a class='dropdown-item' onclick='dataMorphPSCA(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
                    $("#x_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(undefined," + n + ",undefined)'>" + func_name[n] + "</a>");
                    $("#y_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(undefined,undefined," + n + ")'>" + func_name[n] + "</a>");
                  }
                  // Populate chain options in html
                  var available_chains = Object.keys(in_chain).sort();
                  var reference_chain_array = ['IGH', 'IGHA1', 'IGHA2', 'IGHD', 'IGHE', 'IGHG1', 'IGHG2', 'IGHG3', 'IGHG4', 'IGHM', 'IGK+IGL', 'IGK', 'IGL', 'TRA', 'TRB', 'TRD', 'TRG'];
                  var sub_chain_array = ['IGHA1', 'IGHA2', 'IGHD', 'IGHE', 'IGHG1', 'IGHG2', 'IGHG3', 'IGHG4', 'IGHM'];
                  if (available_chains.includes('IGK+IGL')) { sub_chain_array = sub_chain_array.concat(['IGK', 'IGL']) }
                  available_chains.sort(function (a, b) {
                    return reference_chain_array.indexOf(a) - reference_chain_array.indexOf(b);
                  });
                  for (let n = 0; n < available_chains.length; n++) {
                    var indent = ''
                    if ((sub_chain_array.includes(available_chains[n]))) { indent = '&emsp;' }
                    $("#chain_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined, &quot;" + available_chains[n] + "&quot;,undefined)'>" + indent + available_chains[n] + "</a>");
                    $("#chain_selection_psca").append("<a class='dropdown-item' onclick='dataMorphPSCA(&quot;" + available_chains[n] + "&quot;,undefined,undefined)'>" + indent + available_chains[n] + "</a>");
                    $("#chain_selection_scatter").append("<a class='dropdown-item' onclick='dataMorphScatter(&quot;" + available_chains[n] + "&quot;,undefined,undefined)'>" + indent + available_chains[n] + "</a>");
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
}

//populate_page();

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

  if (Object.keys(ica_meta)[0] != 'no_cond_cond'){
    draw_heatmap();
  }
  // If secondary condition was already activated, rerun that function to account for change in primary condition
  if (activated_cond_2nd == true) {
    if (curr_cond_2nd == ''){
      cond_2nd_idx = undefined
    } else {
      cond_2nd_idx = cond_name.indexOf(curr_cond_2nd)
    }
    condition_2nd(cond_2nd_idx);
  } else {

    $("#pval_table_space").html("");
    $("#pval_table_space").removeClass("row");
    $("#pval_table_space").css('column-gap', '');

    var myTableDiv = document.getElementById("pval_table_space")
    var table = document.createElement('TABLE')
    var tableBody = document.createElement('TBODY')

    //table.border = '1'
    table.classList.add('table-sm');
    table.classList.add('table-bordered');

    table.appendChild(tableBody);
    heading = [...curr_group];
    heading.unshift("");

    //TABLE COLUMNS
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);
    for (i = 0; i < heading.length; i++) {
      var th = document.createElement('TH')
      th.width = '75';
      th.appendChild(document.createTextNode(heading[i]));
      tr.appendChild(th);
    }

    //TABLE ROWS
    for (i = 0; i < curr_group.length; i++) {

      var tr = document.createElement('TR');
      var td = document.createElement('TD');
      td.style.fontWeight = 'bold';

      td.appendChild(document.createTextNode(curr_group[i]));
      tr.appendChild(td)

      for (j = 0; j < curr_group.length; j++) {
        var td = document.createElement('TD')
        if (curr_group[i] == curr_group[j]) {
          td.appendChild(document.createTextNode(""));
          tr.appendChild(td);
        } else {
          if (typeof ica_data[curr_cond][curr_group[i]][curr_chain] !== 'undefined' && typeof ica_data[curr_cond][curr_group[j]][curr_chain] !== 'undefined') {
            if (typeof ica_data[curr_cond][curr_group[i]][curr_chain][curr_func] !== 'undefined' && typeof ica_data[curr_cond][curr_group[j]][curr_chain][curr_func] !== 'undefined') {
              td.appendChild(document.createTextNode(
                toExp(
                  mannwhitneyu.test(
                    ica_data[curr_cond][curr_group[i]][curr_chain][curr_func].map(Number),
                    ica_data[curr_cond][curr_group[j]][curr_chain][curr_func].map(Number)
                  )["p"]
                )
              ));
              if (
                mannwhitneyu.test(
                  ica_data[curr_cond][curr_group[i]][curr_chain][curr_func].map(Number),
                  ica_data[curr_cond][curr_group[j]][curr_chain][curr_func].map(Number)
                  )["p"] <= .05
                ) { td.style.fontWeight = 'bold'; }
              if (median(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func].map(Number)) > median(ica_data[curr_cond][curr_group[j]][curr_chain][curr_func].map(Number))) {
                td.style.backgroundColor = '#ffcccb';
              } else if (median(ica_data[curr_cond][curr_group[j]][curr_chain][curr_func].map(Number)) > median(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func].map(Number))) {
                td.style.backgroundColor = '#c3e4e8';
              }
            }
          } else {
            td.appendChild(document.createTextNode(""));
          }
          tr.appendChild(td);
        }
      }
      tableBody.appendChild(tr);
    }
    myTableDiv.appendChild(table);
  }

}

function condition_2nd(cond_2nd_idx) {

  if (typeof cond_2nd_idx != "undefined") {
    curr_cond_2nd = cond_name[cond_2nd_idx];
    curr_group_2nd = cond_group[cond_2nd_idx];
  }

  activated_cond_2nd = true;

  condition_2nd_x = [];
  curr_sample = [];
  curr_y = [];

  z_vals_2nd = Array.from(Array(func_name.length), () => Array.from(Array(curr_group_2nd.length), () => Array.from(Array(curr_group.length), () => [])));
  primary_cond_heatmap = Array.from(Array(curr_group_2nd.length), () => Array.from(Array(curr_group.length), () => []));
  curr_sample_sub = Array.from(Array(curr_group_2nd.length), () => Array.from(Array(curr_group.length), () => []));
  secondary_cond_heatmap = Array.from(Array(curr_group_2nd.length), () => []);

  pval_arrays = Array.from(Array(curr_group.length), () => []);

  // Loop through groups in current condition and push data for them
  for (let i = 0; i < curr_group.length; i++) {
    if (typeof ica_meta_ordered[curr_cond][curr_group[i]] !== 'undefined'){
      curr_sample.push(ica_meta_ordered[curr_cond][curr_group[i]][curr_chain]);
      curr_y.push([]);
      condition_2nd_x.push([]);
      //curr_sample_sub.push([]);
    }
  }

  for (let i = 0; i < curr_sample.length; i++) {
    if (typeof curr_sample[i] !== 'undefined') {
      for (let j = 0; j < curr_sample[i].length; j++) {
        var sample = curr_sample[i][j];
        // Loop through secondary condition groups
        for (let k = 0; k < curr_group_2nd.length; k++) {
          if (typeof ica_meta_ordered[curr_cond_2nd][curr_group_2nd[k]] !== 'undefined') {
            if (typeof ica_meta_ordered[curr_cond_2nd][curr_group_2nd[k]][curr_chain] !== 'undefined') {
              // If primary condition group includes sample...
              if (ica_meta_ordered[curr_cond_2nd][curr_group_2nd[k]][curr_chain].includes(sample)) {
                // Push corresponding x (secondary condition grouping) and y (primary condition value)
                // if (typeof ica_data[curr_cond][curr_group[i]][curr_chain] !== 'undefined'){
                condition_2nd_x[i].push(k);
                curr_y[i].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j]);
                // Prepare heatmap
                for (let l = 0; l < func_name.length; l++) {
                  z_vals_2nd[l][k][i].push(ica_data[curr_cond][curr_group[i]][curr_chain][func_name[l]][j]);
                }
                primary_cond_heatmap[k][i].push(i);
                curr_sample_sub[k][i].push(sample);
                secondary_cond_heatmap[k].push(k);
                //if (curr_group.length == 2) {
                pval_arrays[i][k] = pval_arrays[i][k] || [];
                pval_arrays[i][k].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j]);
                //}
              }
              // }
            }
          }
        }
      }
    }
  }

  var x_text = [];
  var x_pvals = [];

  if (curr_group.length == 2) {
    for (let k = 0; k < curr_group_2nd.length; k++) {
      if (typeof pval_arrays[0][k] !== 'undefined' && typeof pval_arrays[1][k] !== 'undefined') {

        if (pval_arrays[0][k].filter(function (el) { return ((el != null) && (el != "")) }).length !== 0 && pval_arrays[1][k].filter(function (el) { return ((el != null) && (el != "")) }).length !== 0) {

          x_text.push(curr_group_2nd[k]);

          var p_val = mannwhitneyu.test(
            pval_arrays[0][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number),
            pval_arrays[1][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number))["p"]

          var p_label = 'n.s.';

          if (pToggle) {
            p_label = "p: " + toExp(p_val)
          } else {
            if (p_val <= .05) {
              p_label = '*'
              if (p_val <= .005) {
                p_label = '**'
                if (p_val <= .0005) {
                  p_label = '***'
                }
              }
            }
          }

          x_pvals.push(
            {
              showarrow: false,
              text: p_label,
              x: k,
              xref: 'x',
              y: 0,
              yref: 'paper',
              font: {
                size: 14,
                color: 'black'
              },
            }
          );
        } else { x_text.push(curr_group_2nd[k]); }
      } else { x_text.push(curr_group_2nd[k]); }
    }
  } else { x_text = curr_group_2nd };

  k_count = 0;
  // Populate available traces
  for (let k = 0; k < condition_2nd_x.length; k++) {
    if (condition_2nd_x[k].length > 0) {
      //if (condition_2nd_x[k].length > 0) {
      var update = {
        x: [condition_2nd_x[k]],
        y: [curr_y[k]]
      }
      Plotly.restyle('intracohortDiv', update, k_count);
      k_count = k_count + 1;
      //}
    }
  }
  // Delete extra remaining traces
  for (let k = k_count; k < intracohortDiv.data.length; k++) {
    Plotly.deleteTraces('intracohortDiv', k_count);
  }

  var update = {
    xaxis: {
      automargin: true,
      tickvals: Object.keys(curr_group_2nd),
      ticktext: x_text,
      zeroline: false,
      showline: true
    },
    annotations: x_pvals,
    boxmode: 'group',
    violinmode: 'group'
  }
  Plotly.relayout('intracohortDiv', update)

  $("#pval_table_space").html("");
  $("#pval_table_space").addClass("row");
  $("#pval_table_space").css('column-gap', '40px');

  for (let k = 0; k < Object.keys(curr_group_2nd).length; k++) {

    pval_populated = false;

    var myTableDiv = document.getElementById("pval_table_space")

    var c = document.createElement("div");
    c.classList.add('column');
    myTableDiv.appendChild(c);

    var t = document.createElement("b");
    t.innerHTML = (curr_group_2nd[k].concat(":"));
    //t.style.fontWeight = 'bold';
    c.appendChild(t);

    var table = document.createElement('TABLE')
    var tableBody = document.createElement('TBODY')

    table.classList.add('table-sm');
    table.classList.add('table-bordered');
    table.appendChild(tableBody);

    heading = [...curr_group];
    heading.unshift("");

    //TABLE COLUMNS
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);
    for (i = 0; i < heading.length; i++) {
      var th = document.createElement('TH')
      th.width = '75';
      th.appendChild(document.createTextNode(heading[i]));
      tr.appendChild(th);
    }

    //TABLE ROWS
    for (i = 0; i < curr_group.length; i++) {

      var tr = document.createElement('TR');
      var td = document.createElement('TD');
      td.style.fontWeight = 'bold';

      td.appendChild(document.createTextNode(curr_group[i]));
      tr.appendChild(td)

      for (j = 0; j < curr_group.length; j++) {
        var td = document.createElement('TD')
        if (curr_group[i] == curr_group[j]) {
          td.appendChild(document.createTextNode(""));
          tr.appendChild(td);
        } else {
          if (typeof pval_arrays[i][k] !== 'undefined' && typeof pval_arrays[j][k] !== 'undefined') {
            if (pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).length !== 0 && pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).length !== 0) {
              pval_populated = true;
              td.appendChild(document.createTextNode(
                toExp(
                  mannwhitneyu.test(
                    pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number),
                    pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number)
                  )["p"]
                )
              ));
              if (
                mannwhitneyu.test(
                  pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number),
                  pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number)
                  )["p"] <= .05
                ) { td.style.fontWeight = 'bold'; }
              if (median(pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number)) > median(pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number))) {
                td.style.backgroundColor = '#ffcccb';
              } else if (median(pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number)) > median(pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number))) {
                td.style.backgroundColor = '#c3e4e8';
              }
            }
          } else {
            td.appendChild(document.createTextNode(""));
          }
          tr.appendChild(td);
        }
      }
      tableBody.appendChild(tr);
    }
    if (pval_populated == false) {
      var br = document.createElement("br");
      c.appendChild(br);
      var tn = document.createTextNode('None');
      c.appendChild(tn);
      var br = document.createElement("br");
      c.appendChild(br);
    } else {
      c.appendChild(table);
    }
    if (k != Object.keys(curr_group_2nd).length - 1) {
      var br = document.createElement("br");
      c.appendChild(br);
    }
  }


  $("#dropdown2ndCondition").text("x: " + curr_cond_2nd);
  $("#dropdownCondition").text("hue: " + curr_cond);
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
    $("#button2nd_condition").prepend('<button id="swap_2nd" type="button" onclick="swap_conds()" class="btn btn-warning">&UpArrowDownArrow;</button>');
  }

  draw_heatmap_2nd();

}

function clear_2nd() {

  activated_cond_2nd = false;
  dataMorph();
  // Refresh secondary condition selection
  $("#dropdownCondition").text(curr_cond);
  $("#dropdown2ndCondition").text("Select Secondary Condition");
  $("#cancel_2nd").remove();
  $("#swap_2nd").remove();
  $("#condition_selection").children().filter(function () {
    return $(this).text() == curr_cond_2nd;
  }).removeAttr('style');

}

function swap_conds() {

  new_2nd = cond_name.indexOf(curr_cond);
  dataMorph(cond_name.indexOf(curr_cond_2nd), undefined, undefined);
  condition_2nd(new_2nd);

}

function draw_traces() {

  var data = [];
  var pvals = [];

  for (let k = 0; k < curr_group.length; k++) {
    // Populate trace data (Just primary condition data)
    if (typeof ica_data[curr_cond][curr_group[k]][curr_chain] !== 'undefined') {
      var trace = {
        type: plot_type,
        boxpoints: 'all',
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        pointpos: 0,
        y: ica_data[curr_cond][curr_group[k]][curr_chain][curr_func],
        x: Array(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].length).fill(k),
        name: curr_group[k],
        visible: true
      };
      data.push(trace);
    }
    // p-value annotation
    if (k < curr_group.length - 1 && curr_group.length == 2) {
      if (typeof ica_data[curr_cond][curr_group[k]][curr_chain] !== 'undefined' && typeof ica_data[curr_cond][curr_group[k + 1]][curr_chain] !== 'undefined') {
        if (typeof ica_data[curr_cond][curr_group[k]][curr_chain][curr_func] !== 'undefined' && typeof ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func] !== 'undefined') {
          var p_label = 'n.s.';
          var p_val = mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].map(Number), ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func].map(Number))["p"];

          if (pToggle) {
            p_label = "p: " + toExp(p_val)
          } else {
            if (p_val <= .05) {
              p_label = '*'
              if (p_val <= .005) {
                p_label = '**'
                if (p_val <= .0005) {
                  p_label = '***'
                }
              }
            }
          }
        }
      } else { var p_label = ""; }
      var anno = {
        showarrow: false,
        text: p_label,
        x: k + .5,
        xref: 'x',
        y: 0,
        yref: 'paper',
        font: {
          size: 14,
          color: 'black'
        },
      }
      pvals.push(anno);
    }
  }
  // Plot layout
  var layout = {
    title: cohort_name_intra,
    yaxis: {
      title: curr_chain + ' ' + curr_func,
      zeroline: false,
      showline: true
    },
    //boxmode: 'group',
    font: { size: 14 },
    xaxis: {
      automargin: true,
      tickvals: Object.keys(curr_group),
      ticktext: curr_group,
      zeroline: false,
      showline: true
    },
    annotations: pvals,
    showlegend: true,
    legend: {traceorder: 'reversed'}
  };
  // Render plot
  Plotly.newPlot("intracohortDiv", data, layout, { modeBarButtonsToRemove: ['toImage'] });
  // Hide p-vals of hidden traces
  var pval_vis = Array(curr_group.length).fill(true);
  $('.legendtoggle').on('click', function () {
    if (activated_cond_2nd == false) {
      pval_vis[$(this).parent().index()] = !(pval_vis[$(this).parent().index()]);
      var pvals = [];
      for (let k = 0; k < pval_vis.length - 1; k++) {
        if (pval_vis[k] == true && pval_vis[k + 1] == true) {
          if (typeof ica_data[curr_cond][curr_group[k]][curr_chain][curr_func] !== 'undefined' && typeof ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func] !== 'undefined') {
            var p_label = 'n.s.';
            var p_val = mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].map(Number), ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func].map(Number))["p"];

            if (pToggle) {
              p_label = "p: " + toExp(p_val)
            } else {
              if (p_val <= .05) {
                p_label = '*'
                if (p_val <= .005) {
                  p_label = '**'
                  if (p_val <= .0005) {
                    p_label = '***'
                  }
                }
              }
            }
          } else { var p_label = ""; }
          var anno = {
            showarrow: false,
            text: p_label,
            x: k + .5,
            xref: 'x',
            y: 0,
            yref: 'paper',
            font: {
              size: 14,
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

function draw_heatmap() {

  curr_color_codes = [];
  tick_pos = [];

  // Define color codes based off of plotly.js defaults and group length
  for (let k = 0; k < curr_group.length; k++) {
     curr_color_codes.push([k/(curr_group.length),color_codes[k % 10]]);
     curr_color_codes.push([(k+1)/(curr_group.length),color_codes[(k) % 10]]);
      // tick position
     tick_pos.push((curr_group.length-1)*(((k/(curr_group.length))+((k+1)/(curr_group.length)))/2))
  }

  z_vals = Array.from(Array(func_name.length), () => []);
  z_vals_cond = []
  x_vals_name = []

  for (let k = 0; k < curr_group.length; k++) {
    // Populate trace data (Just primary condition data

    if (typeof ica_data[curr_cond][curr_group[k]][curr_chain] !== 'undefined') {

      let indices = [...ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].keys()].sort((a, b) => ica_data[curr_cond][curr_group[k]][curr_chain][curr_func][b] - ica_data[curr_cond][curr_group[k]][curr_chain][curr_func][a]);

      for (let l = 0; l < func_name.length; l++) {

        if (window.ica_data[curr_cond][curr_group[k]][curr_chain] !== undefined) {

          z_vals[l] = [].concat(z_vals[l], [ica_data[curr_cond][curr_group[k]][curr_chain][func_name[l]]].map(a => indices.map(i => a[i]))[0])
        }
        // Peform normalization
        if (k == curr_group.length - 1) {
          zval_clone = [...z_vals[l]].map(parseFloat);
          zval_med = q50(zval_clone)
          zval_iqr = q75(zval_clone) - q25(zval_clone)
          z_vals[l] = z_vals[l].map(normalize(zval_med, zval_iqr))
          z_vals[l] = z_vals[l].map(value => isNaN(value) ? 0 : value);
          // z_vals[l] = z_vals[l].map(normalize(Math.min(...z_vals[l]), Math.max(...z_vals[l])))
        }
      }
      // populate condition and name arrays
      if (window.ica_data[curr_cond][curr_group[k]][curr_chain] !== undefined) {
        z_vals_cond = [].concat(z_vals_cond, Array(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].length).fill(k))
        x_vals_name = [].concat(x_vals_name, [ica_meta_ordered[curr_cond][curr_group[k]][curr_chain]].map(a => indices.map(i => a[i]))[0])
      }
    }
}
  // clean colorbar text
  curr_group_mod = Array.from(Array(curr_group.length), () => []);;
  for(var i=0; i<curr_group.length; ++i){
    curr_group_mod[i] = curr_group[i].split(' ').join('<br>').split('/').join('/<br>');
  }


  Plotly.newPlot('heatmapDiv', [{
    // color coding
    type: 'heatmap',
    z: [z_vals_cond],
    y: [curr_cond],
    x: x_vals_name,
    // "colorbar" legend
    colorbar:{
      autotick: false,
      tickmode: 'array',
      tickvals: [0].concat(tick_pos,[curr_group.length-1]),
      ticktext: [''].concat(curr_group_mod,['']),
      x: 1.25, y: .75, len: 0.5, thickness: 15,
      title:{text:curr_cond.split(' ').join('<br>')}
    },
    colorscale: curr_color_codes,
    xaxis: 'x',
    yaxis: 'y'
  }, {
    // main heatmap
    type: 'heatmap',
    z: z_vals,
    x: x_vals_name,
    y: func_name,
    yaxis: 'y2',
    xaxis: 'x2',
    colorbar:{thickness: 15},
    zmin: -2,
    zmax: 2
  }], {
    title: cohort_name_intra,
    // alignment of subplots
    yaxis: {domain: [0.9, 1],automargin: true},
    yaxis2: {domain: [0, 0.85],automargin: true},
    xaxis: {visible: false},
    xaxis2: {anchor:'y2',matches: 'x'}
  })
}

function draw_heatmap_2nd() {

  curr_color_codes = [];
  tick_pos = [];
  
  // Define color codes based off of plotly.js defaults and group length
  for (let k = 0; k < curr_group.length; k++) {
    curr_color_codes.push([k/(curr_group.length),color_codes[k % 10]]);
    curr_color_codes.push([(k+1)/(curr_group.length),color_codes[(k) % 10]]);
     // tick position
    tick_pos.push((curr_group.length-1)*(((k/(curr_group.length))+((k+1)/(curr_group.length)))/2))
 }

 curr_color_codes_2nd = [];
 tick_pos_2nd = [];
 // Define color codes based off of plotly.js defaults and group length
 for (let k = 0; k < curr_group_2nd.length; k++) {
   curr_color_codes_2nd.push([k/(curr_group_2nd.length),color_codes_2nd[k % 10]]);
   curr_color_codes_2nd.push([(k+1)/(curr_group_2nd.length),color_codes_2nd[(k) % 10]]);
    // tick position
   tick_pos_2nd.push((curr_group_2nd.length-1)*(((k/(curr_group_2nd.length))+((k+1)/(curr_group_2nd.length)))/2))
}


for (let i = 0; i < z_vals_2nd[func_name.indexOf(curr_func)].length; i++) {
  for (let j = 0; j < z_vals_2nd[func_name.indexOf(curr_func)][i].length; j++) {
    let indices = [...z_vals_2nd[func_name.indexOf(curr_func)][i][j].keys()].sort((a, b) => 
    z_vals_2nd[func_name.indexOf(curr_func)][i][j][b] - 
    z_vals_2nd[func_name.indexOf(curr_func)][i][j][a]);

    for (let k = 0; k < func_name.length; k++) {
      z_vals_2nd[k][i][j] = [z_vals_2nd[k][i][j]].map(a => indices.map(i => a[i]))[0];
    }
    curr_sample_sub[i][j] = [curr_sample_sub[i][j]].map(a => indices.map(i => a[i]))[0];
  }
}


// Populate trace data (secondary condition data)
  for (let l = 0; l < func_name.length; l++) {
    z_vals_2nd[l] = z_vals_2nd[l].flat(Infinity)
    zval_clone = [...z_vals_2nd[l]].map(parseFloat);
    zval_med = q50(zval_clone)
    zval_iqr = q75(zval_clone)-q25(zval_clone)
    z_vals_2nd[l] = z_vals_2nd[l].map(normalize(zval_med,zval_iqr))
    //z_vals_2nd[l] = z_vals_2nd[l].map(normalize(Math.min(...z_vals_2nd[l]), Math.max(...z_vals_2nd[l])))
  }
  // flatten pre-populated condition and name nested arrays
  primary_cond_heatmap = primary_cond_heatmap.flat(Infinity)
  secondary_cond_heatmap = secondary_cond_heatmap.flat(Infinity)
  curr_sample_sub = curr_sample_sub.flat(Infinity)

    // clean colorbar text
    curr_group_mod = Array.from(Array(curr_group.length), () => []);;
    for(var i=0; i<curr_group.length; ++i){
      curr_group_mod[i] = curr_group[i].split(' ').join('<br>').split('/').join('/<br>');
    }

      // clean colorbar text
  curr_group_mod_2nd = Array.from(Array(curr_group_2nd.length), () => []);;
  for(var i=0; i<curr_group_2nd.length; ++i){
    curr_group_mod_2nd[i] = curr_group_2nd[i].split(' ').join('<br>').split('/').join('/<br>');
  }

  Plotly.newPlot('heatmapDiv', [{
            // secondary color coding
    type: 'heatmap',
    z: [secondary_cond_heatmap],
    y: [curr_cond_2nd],
    x: curr_sample_sub,
    colorbar:{
      autotick: false,
      tickmode: 'array',
      tickvals: [0].concat(tick_pos_2nd,[curr_group_2nd.length-1]),
      ticktext: [''].concat(curr_group_mod_2nd,['']),
      x: 1.25, y: .25, len: 0.5, thickness: 15,
      title:{text:curr_cond_2nd.split(' ').join('<br>')}
    },
    colorscale: curr_color_codes_2nd,
    zmin: 0,
    zmax: curr_group_2nd.length-1,
    xaxis: 'x',
    yaxis: 'y'
  },{
        // primary color coding
    type: 'heatmap',
    z: [primary_cond_heatmap],
    y: [curr_cond],
    x: curr_sample_sub,
    colorbar:{
      autotick: false,
      tickmode: 'array',
      tickvals: [0].concat(tick_pos,[curr_group.length-1]),
      ticktext: [''].concat(curr_group_mod,['']),
      x: 1.25, y: .75, len: 0.5, thickness: 15,
      title:{text:curr_cond.split(' ').join('<br>')}
    },
    colorscale: curr_color_codes,
    zmin: 0,
    zmax: curr_group.length-1,
    xaxis: 'x3',
    yaxis: 'y3'
  }, {
        // main heatmap
    type: 'heatmap',
    z: z_vals_2nd,
    x: curr_sample_sub,
    y: func_name,
    yaxis: 'y2',
    xaxis: 'x2',
    colorbar:{thickness: 15},
    zmin: -2,
    zmax: 2
  }], {
    title: cohort_name_intra,
    yaxis: {domain: [0.95, 1],automargin: true},
    yaxis3: {domain: [0.9, .95],automargin: true},
    yaxis2: {domain: [0, 0.85],automargin: true},
    xaxis: {visible: false},
    xaxis3: {visible: false,matches: 'x'},
    xaxis2: {anchor:'y2',matches: 'x'}
  })
}
// Make plot visible or invisible
function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}

// Draw paired sample cohort analysis plot

function pscaDraw() {

  var data = [];

  timepoint_group = cond_group[cond_name.indexOf(pair_split)]
  pair_group = cond_group[cond_name.indexOf("VisGroup")]

  if (curr_split_psca == "psca_allsamples") {
    split_group = [" "]
    paired_sample_split = false
  } else {
    split_group = cond_group[cond_name.indexOf(curr_split_psca)]
    paired_sample_split = true
  }

  z_vals_pair = Array.from(Array(func_name.length), () => Array.from(Array(split_group.length), () => Array.from(Array(timepoint_group.length-1), () => [])))
  xlab_pair=Array.from(Array(split_group.length), () => Array.from(Array(timepoint_group.length-1), () => []));
  timepoint_colorbar=Array.from(Array(split_group.length), () => Array.from(Array(timepoint_group.length-1), () => []));
  split_colorbar=Array.from(Array(split_group.length), () => []);

  median_arrays = Array.from(Array((timepoint_group.length + 10) * (split_group.length + 1)), () => []);
  pval_paired_arrays = Array.from(Array((timepoint_group.length + 10) * (split_group.length + 1)), () => [[], []]);

  for (let k = 0; k < pair_group.length; k++) {

    if (typeof ica_data['VisGroup'][pair_group[k]][curr_chain_psca] !== 'undefined') {

      for (let l = 0; l < (timepoint_group.length - 1); l++) {

        tp_1 = timepoint_group_original.indexOf(timepoint_group[l])
        tp_2 = timepoint_group_original.indexOf(timepoint_group[l+1])

        found_it = false

        for (let z = 0; z < split_group.length; z++) {

          if (checker(ica_meta[curr_split_psca][split_group[z]], ica_meta['VisGroup'][pair_group[k]])) {
            subplot_num = (timepoint_group.length * z);
            found_it = true
            break
          }
        }

        if (found_it == false) {
          break
        }

        if (!([ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2]]).includes(null) && !([ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2]]).includes("")) {

          var median_color = ''

          if (Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1]) > Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2])) {
            median_color = 'royalblue'
          } else if (Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1]) < Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2])) {
            median_color = 'crimson'
          } else {
            median_color = 'grey'
          }

          for (let z = 0; z < split_group.length; z++) {

            if (checker(ica_meta[curr_split_psca][split_group[z]], ica_meta['VisGroup'][pair_group[k]])) {

              for (let p = 0; p < func_name.length; p++) {
                z_vals_pair[p][z][l].push(log2fc(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][func_name[p]][tp_1], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][func_name[p]][tp_2]))
              }
              xlab_pair[z][l].push(pair_group[k] + '_' + l + '/' + (l + 1));
              timepoint_colorbar[z][l].push(l);
              split_colorbar[z].push(z);
              break
            }
          }


          var trace = {
            mode: 'lines+markers',
            type: 'scatter',
            x: [
              (subplot_num + l + k / 2000 - pair_group.length / 4000),
              ((subplot_num + l + 1) + k / 2000 - pair_group.length / 4000)
            ],
            y: [ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2]],
            name: pair_group[k],
            visible: true,
            marker: {
              color: 'grey',
              size: 4
            },
            line: {
              color: median_color,
              width: 1
            }
          };

          data.push(trace);

          median_arrays[subplot_num + l][pair_group[k]] = Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1]);
          median_arrays[subplot_num + l + 1][pair_group[k]] = Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2]);

          pval_paired_arrays[subplot_num + l][0].push(Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_1]));
          pval_paired_arrays[subplot_num + l][1].push(Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][tp_2]));

        }

      }
    }

    if (k == pair_group.length - 1) {

      var trace = {
        mode: 'markers',
        type: 'scatter',
        x: Array.from(Array(timepoint_group.length * split_group.length).keys()),
        y: median_arrays.map(x => median(Object.values(x))),
        name: "Median",
        visible: true,
        marker: {
          color: 'black',
          size: 25,
          symbol: 'line-ew',
          line: {
            color: 'black',
            width: 4
          }
        }
      };
      data.unshift(trace);

      pval_anno = []

      x_length = Array.from(Array(timepoint_group.length * split_group.length).keys()).length
      if (x_length > 12) { p_prefix = "p:<br>" } else { p_prefix = "p: " }

      for (let m = 0; m < (pval_paired_arrays.length); m++) {

        if (pval_paired_arrays[m][0].length > 0) {
          // check if all x-y values equal 0
          all_0_check = pval_paired_arrays[m][0].map(Number).map(function(v,i) { return (v - pval_paired_arrays[m][1].map(Number)[i]); }); 
          if (all_0_check.some(item => item !== 0)){
            var p_val = wilcoxon(pval_paired_arrays[m][0].map(Number), pval_paired_arrays[m][1].map(Number), zero_method = 'wilcox', correction = true)['P'];
          } else {
            var p_val = 1;
          }
          var p_label = 'n.s.';

          if (pToggle) {
            p_label = p_prefix + toExp(p_val)
          } else {
            if (p_val <= .05) {
              p_label = '*'
              if (p_val <= .005) {
                p_label = '**'
                if (p_val <= .0005) {
                  p_label = '***'
                }
              }
            }
          }

          pval_anno.push({
            showarrow: false,
            text: p_label,
            x: m + .5,
            xref: 'x',
            y: 0,
            yref: 'paper',
            font: {
              size: 14,
              color: 'black'
            },
          });
        }

      }




    }

  }

  for (let k = 0; k < split_group.length; k++) {

    pval_anno.push({
      showarrow: false,
      text: split_group[k].split(' ').join('<br>').split('/').join('/<br>'),
      x: (k * timepoint_group.length) + ((timepoint_group.length - 1) * .5),
      xref: 'x',
      y: 1.06,
      yref: 'paper',
      yanchor: 'top',
      font: {
        size: 14,
        color: 'black'
      },
    });
  };

  x_lab = [].concat(... new Array(split_group.length).fill(timepoint_group))

  // Plot layout
  var layout = {
    title: cohort_name_pair,
    font: { size: 14 },
    yaxis: {
      title: curr_chain_psca + ' ' + curr_func_psca,
      zeroline: false,
      showline: true
    },
    xaxis: {
      automargin: true,
      tickvals: Array.from(Array(x_lab.length).keys()),
      ticktext: x_lab,
      zeroline: false,
      showline: true
    },
    showlegend: false,
    annotations: pval_anno
  };
  // Render plot
  Plotly.newPlot("pscaDiv", data, layout, { modeBarButtonsToRemove: ['toImage'] });
}


function draw_paired_heatmap() {

  curr_color_codes_paired = [];
  tick_pos = [];
  timepoint_paired_group = [];
  for (let k = 0; k < timepoint_group.length-1; k++) {
    timepoint_paired_group.push(timepoint_group[k]+'/'+timepoint_group[k+1])
  }
  // Define color codes based off of plotly.js defaults and group length
  for (let k = 0; k < timepoint_paired_group.length; k++) {
     curr_color_codes_paired.push([k/(timepoint_paired_group.length),color_codes[k % 10]]);
     curr_color_codes_paired.push([(k+1)/(timepoint_paired_group.length),color_codes[(k) % 10]]);
      // tick position
     tick_pos.push((timepoint_paired_group.length-1)*(((k/(timepoint_paired_group.length))+((k+1)/(timepoint_paired_group.length)))/2))
  }

  if (paired_sample_split == true){

    curr_split_color = [];
    tick_pos_split = [];

    for (let k = 0; k < split_group.length; k++) {
      curr_split_color.push([k/(split_group.length),color_codes_2nd[k % 10]]);
      curr_split_color.push([(k+1)/(split_group.length),color_codes_2nd[(k) % 10]]);
       // tick position
       tick_pos_split.push((split_group.length-1)*(((k/(split_group.length))+((k+1)/(split_group.length)))/2)) 
    }

    curr_split_color_mod = Array.from(Array(split_group.length), () => []);;
    for(var i=0; i<split_group.length; ++i){
      curr_split_color_mod[i] = split_group[i].split(' ').join('<br>').split('/').join('/<br>');
    }
      
  }

  for (let i = 0; i < z_vals_pair[func_name.indexOf(curr_func_psca)].length; i++) {
    for (let j = 0; j < z_vals_pair[func_name.indexOf(curr_func_psca)][i].length; j++) {
      let indices = [...z_vals_pair[func_name.indexOf(curr_func_psca)][i][j].keys()].sort((a, b) => 
      z_vals_pair[func_name.indexOf(curr_func_psca)][i][j][b] - 
      z_vals_pair[func_name.indexOf(curr_func_psca)][i][j][a]);
  
      for (let k = 0; k < func_name.length; k++) {
        z_vals_pair[k][i][j] = [z_vals_pair[k][i][j]].map(a => indices.map(i => a[i]))[0];
      }
      xlab_pair[i][j] = [xlab_pair[i][j]].map(a => indices.map(i => a[i]))[0];
    }
  }
  

  
// paired sample heatmap

if (paired_sample_split == true){

  Plotly.newPlot('heatmapPairedDiv', [{
    
    // color coding
    type: 'heatmap',
    z: [split_colorbar.flat(Infinity)],
    y: [curr_split_psca],
    x: xlab_pair.flat(Infinity),
    // "colorbar" legend
    colorbar:{
      autotick: false,
      tickmode: 'array',
      tickvals: [0].concat(tick_pos_split,[split_group.length-1]),
      ticktext: [''].concat(curr_split_color_mod,['']),
      x: 1.25, y: .25, len: 0.5, thickness: 15,
      title:{text:curr_split_psca.split(' ').join('<br>')}
    },
    colorscale: curr_split_color,
    zmin: 0,
    zmax: split_group.length-1,
    xaxis: 'x',
    yaxis: 'y'
  },{
    
    // color coding
    type: 'heatmap',
    z: [timepoint_colorbar.flat(Infinity)],
    y: [pair_split],
    x: xlab_pair.flat(Infinity),
    // "colorbar" legend
    colorbar:{
      autotick: false,
      tickmode: 'array',
      tickvals: [0].concat(tick_pos,[timepoint_paired_group.length-1]),
      ticktext: [''].concat(timepoint_paired_group,['']),
      x: 1.25, y: .75, len: 0.5, thickness: 15,
      title:{text:'Timepoint'}
    },
    colorscale: curr_color_codes_paired,
    xaxis: 'x3',
    yaxis: 'y3'
  }, {
    // main heatmap
    type: 'heatmap',
    z: z_vals_pair.map(function(e) { 
      return e.flat(Infinity);
    }),
    x: xlab_pair.flat(Infinity),
    y: func_name,
    yaxis: 'y2',
    xaxis: 'x2',
    colorbar:{thickness: 15},
    zmin: -2, 
    zmax: 2
  }], {
    title: cohort_name_pair,
    // alignment of subplots
    yaxis: {domain: [0.95, 1],automargin: true},
    yaxis3: {domain: [0.9, .95],automargin: true},
    yaxis2: {domain: [0, 0.85],automargin: true},
    xaxis: {visible: false},
    xaxis3: {visible: false,matches: 'x'},
    xaxis2: {anchor:'y2',matches: 'x'}
  })
  } else {
    Plotly.newPlot('heatmapPairedDiv', [{
      // color coding
      type: 'heatmap',
      z: [timepoint_colorbar.flat(Infinity)],
      y: [pair_split],
      x: xlab_pair.flat(Infinity),
      // "colorbar" legend
      colorbar:{
        autotick: false,
        tickmode: 'array',
        tickvals: [0].concat(tick_pos,[timepoint_paired_group.length-1]),
        ticktext: [''].concat(timepoint_paired_group,['']),
        x: 1.25, y: .75, len: 0.5, thickness: 15,
        title:{text:'Timepoint'}
      },
      colorscale: curr_color_codes_paired,
      xaxis: 'x',
      yaxis: 'y'
    }, {
      // main heatmap
      type: 'heatmap',
      z: z_vals_pair.map(function(e) { 
        return e.flat(Infinity);
      }),
      x: xlab_pair.flat(Infinity),
      y: func_name,
      yaxis: 'y2',
      xaxis: 'x2',
      colorbar:{thickness: 15},
      zmin: -2, 
      zmax: 2
    }], {
      title: cohort_name_pair,
      // alignment of subplots
      yaxis: {domain: [0.9, 1],automargin: true},
      yaxis2: {domain: [0, 0.85],automargin: true},
      xaxis: {visible: false},
      xaxis2: {anchor:'y2',matches: 'x'}
    })

  }

}


// Paired sample cohort analysis data morph

function dataMorphPSCA(chain, split, func) {
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain_psca = chain;
    $("#dropdownChainPSCA").text(curr_chain_psca);
  }
  // Function change
  if (typeof split != "undefined") {
    if (split == "none") {
      curr_split_psca = 'psca_allsamples'
      $("#dropdownSplitPSCA").text("No Split");
    } else {
      curr_split_psca = cond_name[split];
      $("#dropdownSplitPSCA").text(curr_split_psca);
    }
  }
  // Function change
  if (typeof func != "undefined") {
    curr_func_psca = func_name[func];
    $("#dropdownFunctionPSCA").text(curr_func_psca);
  }

  pscaDraw();
  draw_paired_heatmap();

}

// Draw plotly scatterplot

function scatterDraw() {

  var trace1 = {
    x: all_data[curr_chain_scatter][curr_x_scatter],
    y: all_data[curr_chain_scatter][curr_y_scatter],
    mode: 'markers',
    type: 'scatter'
  };

  var data = [trace1];

  var layout = {
    title: cohort_name_scatter,
    font: { size: 14 },
    xaxis: {
      automargin: true,
      title: curr_x_scatter,
      zeroline: false,
      showline: true
    },
    yaxis: {
      title: curr_chain_scatter + ' ' + curr_y_scatter,
      zeroline: false,
      showline: true
    }
  };

  Plotly.newPlot('scatterDiv', data, layout, { modeBarButtonsToRemove: ['toImage'] });

}

// Scatterplot morphing

function dataMorphScatter(chain, x, y) {
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain_scatter = chain;
    $("#dropdownChainScatter").text(curr_chain_scatter);
  }
  // Function change
  if (typeof x != "undefined") {
    curr_x_scatter = func_name[x];
    $("#dropdownXScatter").text("x: " + curr_x_scatter);
  }
  // Function change
  if (typeof y != "undefined") {
    curr_y_scatter = func_name[y];
    $("#dropdownYScatter").text("y: " + curr_y_scatter);
  }

  scatterDraw();

}

// Image display

$(document).ready(function () {
  $('.imageEmbed').attr("src", function () { return data_path + $(this).attr("id") });
  $(".imageEmbed").on("load", function () {
    $('.static').removeAttr('style');
  });
});

// P-value display toggle

$(document).on('change', '.p-control', function (e) {
  pToggle = e.target.checked;
  dataMorph();
  if (cond_name.includes('VisGroup')) {
    pscaDraw();
  }

});

var plotTypes = {};
plotTypes['violin'] = 'Violin Plot';
plotTypes['box'] = 'Box Plot';

function plot_type_change(plot_type_new){
  plot_type = plot_type_new;
  dataMorph();
  $("#dropdownPlotType").text(plotTypes[plot_type_new]);
}