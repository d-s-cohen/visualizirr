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

var pair_split = ""

var timepoint_group = [];
var pair_group = [];

var curr_chain_psca = "";
var curr_func_psca = "";
var curr_split_psca = "psca_allsamples";

var curr_x_scatter = "";
var curr_y_scatter = "";
var curr_chain_scatter = "";

var sample_list = [];

var ica_meta_ordered = [];

var pToggle = false;
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

const median = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

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
  url: data_path + "meta.csv",
  type: 'HEAD',
  error: function () {
    d3.text(data_path + "intracohort_data.csv").then(function (data) {

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
          if (i == (data_rows.length - 1)) {

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
            $("#dropdownFondition").text(func_name[curr_func]);
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
            if (meta_header[i].split("|").slice(1).length == 0) {
              ica_meta[cond_name[i]][grouping].push(meta_rows[j][0]);
            } else {
              ica_meta[cond_name[i]][cond_group[i][grouping]].push(meta_rows[j][0]);
            }
          }
        }
        // On last meta table row...
        if (j == (meta_rows.length - 1)) {

          d3.text(data_path + "intracohort_data.csv").then(function (data) {

            var data_rows = d3.csvParseRows(data);
            func_name = data_rows[0].slice(2);
            all_data = [];

            for (let i = 1; i < data_rows.length; i++) {
              // Collect information on which chains are included for cond_group
              in_chain[data_rows[i][1]] = in_chain[data_rows[i][1]] || [];
              in_chain[data_rows[i][1]].push(data_rows[i][0]);

              all_data[data_rows[i][1]] = all_data[data_rows[i][1]] || [];
              for (let m = 0; m < func_name.length; m++) {
                all_data[data_rows[i][1]][func_name[m]] = all_data[data_rows[i][1]][func_name[m]] || [];
                all_data[data_rows[i][1]][func_name[m]].push(data_rows[i][m + 2])
              }


              // Loop through available conditions
              for (let k = 0; k < cond_name.length; k++) {
                // Loop through condition groups
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
                // On last data table row draw plot
                if (i == (data_rows.length - 1)) {
                  $(document).ready(function () {
                    curr_func = func_name[0];
                    curr_chain = Object.keys(in_chain)[0];
                    if (cond_name[0] == 'VisGroup') {
                      curr_cond = cond_name[1];
                      curr_group = cond_group[1];
                    } else {
                      curr_cond = cond_name[0];
                      curr_group = cond_group[0];
                    }
                    curr_func_psca = func_name[0];
                    curr_chain_psca = Object.keys(in_chain)[0];
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
                    }
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
                  $("#dropdownFondition").text(func_name[curr_func]);
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
    for (i = 0; i < Object.keys(ica_data[curr_cond]).length; i++) {

      var tr = document.createElement('TR');
      var td = document.createElement('TD');
      td.style.fontWeight = 'bold';

      td.appendChild(document.createTextNode(Object.keys(ica_data[curr_cond])[i]));
      tr.appendChild(td)

      for (j = 0; j < Object.keys(ica_data[curr_cond]).length; j++) {
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
              if (toExp(
                mannwhitneyu.test(
                  ica_data[curr_cond][curr_group[i]][curr_chain][curr_func].map(Number),
                  ica_data[curr_cond][curr_group[j]][curr_chain][curr_func].map(Number)
                )["p"]
              ) < .05) { td.style.fontWeight = 'bold'; }
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
  var curr_sample = [];
  curr_y = [];

  // if (curr_group.length == 2) {
  //   pval_arrays = [[], []];
  // }

  pval_arrays = Array.from(Array(curr_group.length), () => []);

  // Loop through groups in current condition and push data for them
  for (let i = 0; i < curr_group.length; i++) {
    curr_sample.push(ica_meta_ordered[curr_cond][curr_group[i]][curr_chain]);
    curr_y.push([]);
    condition_2nd_x.push([]);
  }

  for (let i = 0; i < curr_sample.length; i++) {
    for (let j = 0; j < curr_sample[i].length; j++) {
      var sample = curr_sample[i][j];
      // Loop through secondary condition groups
      for (let k = 0; k < curr_group_2nd.length; k++) {
        // If primary condition group includes sample...
        if (ica_meta_ordered[curr_cond_2nd][curr_group_2nd[k]][curr_chain].includes(sample)) {
          // Push corresponding x (secondary condition grouping) and y (primary condition value)
          condition_2nd_x[i].push(k);
          curr_y[i].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j]);
          //if (curr_group.length == 2) {
          pval_arrays[i][k] = pval_arrays[i][k] || [];
          pval_arrays[i][k].push(ica_data[curr_cond][curr_group[i]][curr_chain][curr_func][j]);
          //}
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

          var p_val = toExp(mannwhitneyu.test(
            pval_arrays[0][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number),
            pval_arrays[1][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number))["p"])

          var p_label = 'n.s.';

          if (pToggle) {
            p_label = "p: " + p_val
          } else {
            if (p_val < .05) {
              p_label = '*'
              if (p_val < .005) {
                p_label = '**'
                if (p_val < .0005) {
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
    //if (condition_2nd_x[k].length > 0) {
    var update = {
      x: [condition_2nd_x[k]],
      y: [curr_y[k]]
    }
    Plotly.restyle('intracohortDiv', update, k_count);
    k_count = k_count + 1;
    //}
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
    boxmode: 'group'
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
    for (i = 0; i < Object.keys(ica_data[curr_cond]).length; i++) {

      var tr = document.createElement('TR');
      var td = document.createElement('TD');
      td.style.fontWeight = 'bold';

      td.appendChild(document.createTextNode(Object.keys(ica_data[curr_cond])[i]));
      tr.appendChild(td)

      for (j = 0; j < Object.keys(ica_data[curr_cond]).length; j++) {
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
              if (toExp(
                mannwhitneyu.test(
                  pval_arrays[i][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number),
                  pval_arrays[j][k].filter(function (el) { return ((el != null) && (el != "")) }).map(Number)
                )["p"]
              ) < .05) { td.style.fontWeight = 'bold'; }
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
        type: 'box',
        boxpoints: 'all',
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
          var p_val = toExp(mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].map(Number), ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func].map(Number))["p"]);

          if (pToggle) {
            p_label = "p: " + p_val
          } else {
            if (p_val < .05) {
              p_label = '*'
              if (p_val < .005) {
                p_label = '**'
                if (p_val < .0005) {
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
    title: 'Intracohort Analysis',
    yaxis: {
      title: curr_func,
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
    showlegend: true

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
            var p_val = toExp(mannwhitneyu.test(ica_data[curr_cond][curr_group[k]][curr_chain][curr_func].map(Number), ica_data[curr_cond][curr_group[k + 1]][curr_chain][curr_func].map(Number))["p"]);

            if (pToggle) {
              p_label = "p: " + p_val
            } else {
              if (p_val < .05) {
                p_label = '*'
                if (p_val < .005) {
                  p_label = '**'
                  if (p_val < .0005) {
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
  } else {
    split_group = cond_group[cond_name.indexOf(curr_split_psca)]
  }

  median_arrays = Array.from(Array((timepoint_group.length + 10) * (split_group.length + 1)), () => []);
  pval_paired_arrays = Array.from(Array((timepoint_group.length + 10) * (split_group.length + 1)), () => [[], []]);

  for (let k = 0; k < pair_group.length; k++) {

    if (typeof ica_data['VisGroup'][pair_group[k]][curr_chain_psca] !== 'undefined') {

      for (let l = 0; l < (timepoint_group.length - 1); l++) {

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

        if (!([ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1]]).includes(null) && !([ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1]]).includes("")) {

          var median_color = ''

          if (Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l]) > Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1])) {
            median_color = 'royalblue'
          } else if (Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l]) < Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1])) {
            median_color = 'crimson'
          } else {
            median_color = 'grey'
          }

          var trace = {
            mode: 'lines+markers',
            type: 'scatter',
            x: [
              (subplot_num + l + k / 2000 - pair_group.length / 4000),
              ((subplot_num + l + 1) + k / 2000 - pair_group.length / 4000)
            ],
            y: [ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l], ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1]],
            name: pair_group[k],
            visible: true,
            marker: {
              color: 'grey',
              size: 7
            },
            line: {
              color: median_color,
              width: 1
            },
            hoverinfo: 'none'
          };

          data.push(trace);

          median_arrays[subplot_num + l][pair_group[k]] = Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l]);
          median_arrays[subplot_num + l + 1][pair_group[k]] = Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1]);

          pval_paired_arrays[subplot_num + l][0].push(Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l]));
          pval_paired_arrays[subplot_num + l][1].push(Number(ica_data['VisGroup'][pair_group[k]][curr_chain_psca][curr_func_psca][l + 1]));

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

          var p_val = toExp(wilcoxon(pval_paired_arrays[m][0].map(Number), pval_paired_arrays[m][1].map(Number), zero_method = 'wilcox', correction = true)['P'])
          var p_label = 'n.s.';

          if (pToggle) {
            p_label = p_prefix + p_val
          } else {
            if (p_val < .05) {
              p_label = '*'
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
      text: split_group[k],
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
    title: 'Paired Sample Cohort Analysis',
    font: { size: 14 },
    yaxis: {
      title: curr_func_psca,
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
    title: 'Cohort Scatterplot',
    font: { size: 14 },
    xaxis: {
      automargin: true,
      title: curr_x_scatter,
      zeroline: false,
      showline: true
    },
    yaxis: {
      title: curr_y_scatter,
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