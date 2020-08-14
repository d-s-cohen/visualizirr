"use strict";

const rank = {
  /*
   * Standart ranking
   *
   * The MIT License, Copyright (c) 2014 Ben Magyar
   */
  standard: function(array, key) {
    // sort the array
    array = array.sort(function(a, b) {
      var x = a[key];
      var y = b[key];
      return x < y ? -1 : x > y ? 1 : 0;
    });
    // assign a naive ranking
    for (var i = 1; i < array.length + 1; i++) {
      array[i - 1]["rank"] = i;
    }
    return array;
  },
  /*
   * Fractional ranking
   *
   * The MIT License, Copyright (c) 2014 Ben Magyar
   */
  fractional: function(array, key) {
    array = this.standard(array, key);
    // now apply fractional
    var pos = 0;
    while (pos < array.length) {
      var sum = 0;
      var i = 0;
      for (
        i = 0;
        array[pos + i + 1] && array[pos + i][key] === array[pos + i + 1][key];
        i++
      ) {
        sum += array[pos + i]["rank"];
      }
      sum += array[pos + i]["rank"];
      var endPos = pos + i + 1;
      for (pos; pos < endPos; pos++) {
        array[pos]["rank"] = sum / (i + 1);
      }
      pos = endPos;
    }
    return array;
  }
};

const norm = {
  /*
   * Error function
   *
   * The MIT License, Copyright (c) 2013 jStat
   */
  erf: function(x) {
    var cof = [
      -1.3026537197817094,
      6.4196979235649026e-1,
      1.9476473204185836e-2,
      -9.561514786808631e-3,
      -9.46595344482036e-4,
      3.66839497852761e-4,
      4.2523324806907e-5,
      -2.0278578112534e-5,
      -1.624290004647e-6,
      1.30365583558e-6,
      1.5626441722e-8,
      -8.5238095915e-8,
      6.529054439e-9,
      5.059343495e-9,
      -9.91364156e-10,
      -2.27365122e-10,
      9.6467911e-11,
      2.394038e-12,
      -6.886027e-12,
      8.94487e-13,
      3.13092e-13,
      -1.12708e-13,
      3.81e-16,
      7.106e-15,
      -1.523e-15,
      -9.4e-17,
      1.21e-16,
      -2.8e-17
    ];
    var j = cof.length - 1;
    var isneg = false;
    var d = 0;
    var dd = 0;
    var t, ty, tmp, res;

    if (x < 0) {
      x = -x;
      isneg = true;
    }

    t = 2 / (2 + x);
    ty = 4 * t - 2;

    for (; j > 0; j--) {
      tmp = d;
      d = ty * d - dd + cof[j];
      dd = tmp;
    }

    res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
    return isneg ? res - 1 : 1 - res;
  },

  /*
   * Normal distribution CDF
   *
   * The MIT License, Copyright (c) 2013 jStat
   */
  cdf: function(x, mean, std) {
    return 0.5 * (1 + this.erf((x - mean) / Math.sqrt(2 * std * std)));
  },
  sf: function(x, mean, std) {
    return 1.0 - this.cdf(x, mean, std);
  }
};

const getRepeatCounts = arr => {
  const sorted_arr = arr.slice().sort();
  let results = [];
  let count = 0;
  for (var i = 0; i < sorted_arr.length - 1; i++) {
    const areEqual = sorted_arr[i] === sorted_arr[i + 1];
    if (areEqual) {
      count += 1;
    }
    if (!areEqual || i === sorted_arr.length - 1) {
      if (count > 0) {
        results.push(count);
        count = 0;
      }
    }
  }
  return results;
};

const wilcoxon = (
  x,
  y = null,
  zero_method = "wilcox",
  correction = false,
  alternative = "two-sided"
) => {
  if (!["wilcox", "pratt", "zsplit"].includes(zero_method)) {
    throw "Zero method should be either 'wilcox' or 'pratt' or 'zsplit'";
  }
  if (!["two-sided", "less", "greater"].includes(alternative)) {
    throw "Alternative must be either 'two-sided', 'greater' or 'less'";
  }
  let d, n_zero;
  let warning;

  if (!y && x) {
    d = x;
  } else if (!x || x.length != (y || []).length) {
    throw "Samples x and y must be the same length";
  } else {
    d = x.map((e, i) => e - y[i]);
  }

  if (["wilcox", "pratt"].includes(zero_method)) {
    n_zero = d.filter(e => e === 0).length;
    if (n_zero === d.length) {
      throw "zero_method 'wilcox' and 'pratt' do not work if the x - y is zero for all elements.";
    }
  }

  if (zero_method === "wilcox") {
    d = d.filter(e => e !== 0);
  }

  const count = d.length;
  if (count < 10) {
    warning = "Sample size too small for normal approximation.";
  }

  let r, r_plus, r_minus;
  const rankInput = d.map(v => ({ val: v, abs: Math.abs(v) }));
  r = rank.fractional(rankInput, "abs");
  r_plus = r.map(e => (e.val > 0 ? e.rank : 0)).reduce((a, b) => a + b, 0);
  r_minus = r.map(e => (e.val < 0 ? e.rank : 0)).reduce((a, b) => a + b, 0);

  if (zero_method === "zsplit") {
    r_zero = r.map(e => (e.val === 0 ? e.rank : 0)).reduce((a, b) => a + b, 0);
    r_plus += r_zero / 2.0;
    r_minus += r_zero / 2.0;
  }

  // Min for two-sided, otherwise r_plus, from which r_minus and min can be inferred
  let T, p, mn, se, z;
  if (alternative === "two-sided") {
    T = Math.min(r_plus, r_minus);
  } else {
    T = r_plus;
  }
  mn = count * (count + 1.0) * 0.25;
  se = count * (count + 1.0) * (2.0 * count + 1.0);

  if (zero_method === "pratt") {
    r = r.filter(e => e.rank !== 0);
    mn -= n_zero * (n_zero + 1.0) * 0.25;
    se -= n_zero * (n_zero + 1.0) * (2.0 * n_zero + 1.0);
  }
  const repeatCounts = getRepeatCounts(r.map(e => e.rank));
  if (repeatCounts && repeatCounts.length) {
    // Correction for repeated elements
    se -=
      0.5 * repeatCounts.map(v => v * (v * v - 1.0)).reduce((a, b) => a + b, 0);
  }

  se = Math.sqrt(se / 24);

  // Continuity correction
  let corr = 0;
  if (correction) {
    if (alternative === "two-sided") {
      corr = 0.5 * Math.sign(T - mn);
    } else if (alternative == "less") {
      corr = -0.5;
    } else {
      // if (alternative == 'greater')
      corr = 0.5;
    }
  }

  // Compute with normal approx (appropriate for n>=10)
  if (alternative === "two-sided") {
    const pOneSide = norm.sf(Math.abs(T - corr - mn), 0, se);
    p = 2.0 * pOneSide;
  } else if (alternative === "greater") {
    p = norm.sf(T - corr - mn, 0, se);
  } else {
    p = norm.cdf(T - corr - mn, 0, se);
  }

  return { W: T, P: p, Warning: warning };
};

//export default wilcoxon;