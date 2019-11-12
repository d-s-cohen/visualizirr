function the_mean(a) {
  let sum = a.reduce((previous, current) => current += previous);
  let avg = sum / a.length;
  return avg;
}

var cond1_data = [];
var cond2_data = [];

function data_load(cond1_file, cond2_file, cond1_name, cond2_name) {

  hideOrShow(false, 'plotDiv3')

  d3.text(cond1_file).then(function (data) {
    var cdr3_list = d3.csvParseRows(data);
    for (let i = 0; i < cdr3_list.length; i++) {

      cond1_data = [];

      d3.text("data/out/TRUST_" + cdr3_list[i][0] + "_cdr3.out").then(function (data2) {

        var entries = d3.tsvParseRows(data2);
        for (let j = 0; j < entries.length; j++) {

          var wholeline = entries[j].toString();
          var count = Math.round(entries[j][9])

          const chains = ['IGL', 'IGK', 'IGH', 'TRB', 'TRA', 'TRG', 'TRD'];
          for (var i = 0; i < chains.length; i++) {
            if (wholeline.includes(chains[i])) {
              cond1_data[chains[i]] = cond1_data[chains[i]] || [];
              length = entries[j][7].length
              if (length > 99) { length = 100; }
              if (typeof cond1_data[chains[i]][length] === 'undefined') {
                cond1_data[chains[i]][length] = count;
              } else {
                cond1_data[chains[i]][length] = cond1_data[chains[i]][length] + count;
              }
              break;
            }
          }

          if (j == (entries.length - 1)) {
            var update = {
              x: [Object.keys(cond1_data[currentChain])],
              y: [Object.values(cond1_data[currentChain])],
              name: [cond1_name],
              visible: true
            }
            Plotly.restyle('plotDiv3', update, 0);
          }

        }

      });
    }
  });

  d3.text(cond2_file).then(function (data) {
    var cdr3_list = d3.csvParseRows(data);
    for (let i = 0; i < cdr3_list.length; i++) {

      cond2_data = [];

      d3.text("data/out/TRUST_" + cdr3_list[i][0] + "_cdr3.out").then(function (data2) {

        var entries = d3.tsvParseRows(data2);

        for (let j = 0; j < entries.length; j++) {

          var wholeline = entries[j].toString();
          var count = Math.round(entries[j][9])

          const chains = ['IGL', 'IGK', 'IGH', 'TRB', 'TRA', 'TRG', 'TRD'];
          for (var i = 0; i < chains.length; i++) {
            if (wholeline.includes(chains[i])) {
              cond2_data[chains[i]] = cond2_data[chains[i]] || [];
              length = entries[j][7].length
              if (length > 99) { length = 100; }
              if (typeof cond2_data[chains[i]][length] === 'undefined') {
                cond2_data[chains[i]][length] = count;
              } else {
                cond2_data[chains[i]][length] = cond2_data[chains[i]][length] + count;
              }
              break;
            }
          }

          if (j == (entries.length - 1)) {
            var update = {
              x: [Object.keys(cond2_data[currentChain])],
              y: [Object.values(cond2_data[currentChain])],
              name: [cond2_name],
              visible: true
            }
            Plotly.restyle('plotDiv3', update, 1);
          }

        }

      });

    }
  });
}

div_pre = []

div_post = []

d3.text("data/out/diversity.csv").then(function (data) {

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
      Plotly.restyle('plotDiv', update, 0);
      Plotly.restyle('plotDiv', update, 1);
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

  Plotly.newPlot('plotDiv', data, layout);

  var trace1 = {
    histfunc: "sum",
    name: 'Pre-treatment',
    type: "histogram",
    opacity: 0.5,
    marker: {
      color: 'green',
    },
    xbins: {
      end: 100,
      size: 5,
      start: 1
    }
  };
  var trace2 = {
    histfunc: "sum",
    name: 'Post-treatment',
    type: "histogram",
    opacity: 0.6,
    marker: {
      color: 'red',
    },
    xbins: {
      end: 100,
      size: 5,
      start: 1
    }
  };

  var data = [trace1, trace2];
  var layout = {
    barmode: "stack",
    title: 'CDR3 Length',
    yaxis: {
      title: 'CDR3 Quantity',
      zeroline: false
    },
    xaxis: {
      title: 'Average CDR3 length',
      tickvals: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      ticktext: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, '100+']
    }
  };
  Plotly.newPlot("plotDiv3", data, layout);


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

  data_load("data/out/pre.csv", "data/out/post.csv");

  $("#dropdownCondition").text("Treatment");

  $("#dropdownChain").text("TRA");

});

var currentChain = "TRA";

function chainChange(a) {
  var update = {
    x: [Object.keys(cond1_data[a])],
    y: [Object.values(cond1_data[a])],
  }
  Plotly.restyle('plotDiv3', update, 0);
  var update = {
    x: [Object.keys(cond2_data[a])],
    y: [Object.values(cond2_data[a])],
  }
  Plotly.restyle('plotDiv3', update, 1);

  $("#dropdownChain").text(a);

  currentChain = a;

}

function conditionChange(a, b, c, d, e) {

  data_load(a, b, d, e);

  $("#dropdownCondition").text(c);

}

function hideOrShow(a, b) {
  var update = {
    visible: a
  }
  Plotly.restyle(b, update);
}
