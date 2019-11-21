var meta_info = [];
var cond_name = [];
var cond_0 = [];
var cond_1 = [];
var intracohort_data = [];
var intracohort_header = [];
var curr_cond = 0;
var curr_chain = "TRA";
var curr_func = "CDR3 Length";

d3.text("data/out/meta.csv").then(function (data) {

  var meta_rows = d3.csvParseRows(data);

  var meta_header = meta_rows[0].slice(1);

  for (let j = 1; j < meta_rows.length; j++) {

    if (j == 1) {
      for (let j = 0; j < meta_header.length; j++) {
        // Set up meta info and intracohort data structures
        cond_name[j] = meta_header[j].split("|")[0];
        cond_0[j] = meta_header[j].split("|")[1];
        cond_1[j] = meta_header[j].split("|")[2];
        meta_info[cond_name[j]] = [];
        meta_info[cond_name[j]][cond_0[j]] = [];
        meta_info[cond_name[j]][cond_1[j]] = [];
        intracohort_data[cond_name[j]] = [];
        intracohort_data[cond_name[j]][cond_0[j]] = [];
        intracohort_data[cond_name[j]][cond_1[j]] = [];

        if (j == (meta_header.length - 1)) {
          $(document).ready(function () {
            for (let k = 0; k < cond_name.length; k++) {
              $("#condition_selection").append("<a class='dropdown-item' onclick='dataMorph(" + k + ",undefined,undefined)'>" + cond_name[k] + "</a>");
            }
            $("#dropdownCondition").text(cond_name[curr_cond]);
          });
        }
      }
    }

    for (let i = 0; i < meta_header.length; i++) {
      // Populate available conditions
      if (meta_rows[j][i+1] == "0") {
        meta_info[cond_name[i]][cond_0[i]].push(meta_rows[j][0]);
      } else if (meta_rows[j][i+1] == "1") {
        meta_info[cond_name[i]][cond_1[i]].push(meta_rows[j][0]);
      }
    }

    if (j == (meta_rows.length - 1)) {

      d3.text("data/out/intracohort_data.csv").then(function (data) {

        var intracohort_rows = d3.csvParseRows(data);

        intracohort_header = intracohort_rows[0].slice(2);

        for (let i = 1; i < intracohort_rows.length; i++) {

          for (let k = 0; k < cond_name.length; k++) {
            if (meta_info[cond_name[k]][cond_0[k]].includes(intracohort_rows[i][0])) {
              // Populate if chain is undefined
              intracohort_data[cond_name[k]][cond_0[k]][intracohort_rows[i][1]] = intracohort_data[cond_name[k]][cond_0[k]][intracohort_rows[i][1]] || [];
              for (let m = 0; m < intracohort_header.length; m++) {
                intracohort_data[cond_name[k]][cond_0[k]][intracohort_rows[i][1]][intracohort_header[m]] = intracohort_data[cond_name[k]][cond_0[k]][intracohort_rows[i][1]][intracohort_header[m]] || [];
                intracohort_data[cond_name[k]][cond_0[k]][intracohort_rows[i][1]][intracohort_header[m]].push(intracohort_rows[i][m + 2])
              }
            } else if (meta_info[cond_name[k]][cond_1[k]].includes(intracohort_rows[i][0])) {
              // Populate if chain is undefined
              if (intracohort_data[cond_name[k]][cond_1[k]][intracohort_rows[i][1]] == undefined) {
                intracohort_data[cond_name[k]][cond_1[k]][intracohort_rows[i][1]] = [];
              }
              for (let m = 0; m < intracohort_header.length; m++) {
                intracohort_data[cond_name[k]][cond_1[k]][intracohort_rows[i][1]][intracohort_header[m]] = intracohort_data[cond_name[k]][cond_1[k]][intracohort_rows[i][1]][intracohort_header[m]] || [];
                intracohort_data[cond_name[k]][cond_1[k]][intracohort_rows[i][1]][intracohort_header[m]].push(intracohort_rows[i][m + 2])
              }

            }

            if (i == (intracohort_rows.length - 1)) {
              // Update plot with accumulated values
              var update = {
                y: [intracohort_data[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func]],
                name: [cond_0[curr_cond]],
                visible: true
              }
              Plotly.restyle('intracohortDiv', update, 0);
              // Update plot with accumulated values
              var update = {
                y: [intracohort_data[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func]],
                name: [cond_1[curr_cond]],
                visible: true
              }
              Plotly.restyle('intracohortDiv', update, 1);

              var update = {
                title: String("Intracohort Analysis<br><sub>p-value: "+mannwhitneyu.test(intracohort_data[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func],intracohort_data[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func], alternative = 'less')["p"].toFixed(5)+ "</sub>")
              }

              Plotly.relayout('intracohortDiv', update);

            }
          }
          if (i == (intracohort_rows.length - 1)) {
            $(document).ready(function () {
              for (let n = 0; n < intracohort_header.length; n++) {

                $("#function_selection").append("<a class='dropdown-item' onclick='dataMorph(undefined,undefined," + n + ")'>" + intracohort_header[n] + "</a>");
              }
              $("#dropdownFondition").text(intracohort_header[curr_func]);
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
    //boxmode: 'group',
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
  }
  // Chain change
  if (typeof chain != "undefined") {
    curr_chain = chain;
    $("#dropdownChain").text(curr_chain);
  }
  // Function change
  if (typeof func != "undefined") {
    curr_func = intracohort_header[func];
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
    y: [intracohort_data[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func]],
    name: [cond_0[curr_cond]],
    visible: true
  }
  Plotly.restyle('intracohortDiv', update, 0);

  var update = {
    y: [intracohort_data[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func]],
    name: [cond_1[curr_cond]],
    visible: true
  }
  Plotly.restyle('intracohortDiv', update, 1);

  var update = {
    title: String("Intracohort Analysis<br><sub>p-value: "+mannwhitneyu.test(intracohort_data[cond_name[curr_cond]][cond_0[curr_cond]][curr_chain][curr_func],intracohort_data[cond_name[curr_cond]][cond_1[curr_cond]][curr_chain][curr_func], alternative = 'less')["p"].toFixed(5)+ "</sub>")
  }
  Plotly.relayout('intracohortDiv', update)

}
// Make plot visible or invisible
function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}
