**Data folder structure:**

```
data
├── All
│   ├── cohortAnalysis
│   │   ├── all_sample_PCA.png
│   │   ├── naive0_PCA.png
│   │   └── naive1_PCA.png
│   ├── IGH
│   │   ├── cdr3aaLength.png
│   │   ├── fancyspectra.png
│   │   ├── jsumBarplot.png
│   │   ├── vjpairHeatmap.png
│   │   ├── vjStackBar.png
│   │   └── vsumBarplot.png
│   ├── IGK
│   ├── IGL
│   ├── info.csv
│   ├── TRA
│   ├── TRB
│   ├── TRD
│   └── TRG
├── <Samples...>
│   ├── IGH
│   ├── IGK
│   ├── IGL
│   ├── info.csv
│   ├── TRA
│   ├── TRB
│   ├── TRD
│   └── TRG
├── intracohort_data.csv
├── meta.csv
└── sample_list.csv
```

All chain directories (sample level and cohort level) 
should contain the files shown under the data>All>IGH directory shown above.
Chains and figures that aren't available will not be shown in the report.

the default data path is 'data/'. If you wish to change this path for the current session, you may do so at the top of the home page.

---

**sample_list.csv** needs to contain a newline seperated list of sample directory names.

sample_list.csv template:
```
SampleName0
SampleName1
SampleName2
```

---

**meta.csv** should be a csv with the first column including sample names and remaining columns for different conditions. 
There are a few ways to enter your meta information, but the preferable way is to use a numeric range and denote 
the categorical label of those groups in the header using '|' as the seperator (as demonstrated in condition 0). 
You can also use the labels in the metasheet and not denote them in the header (as demonstrated in condition 1).

meta.csv template:
```
sample,Condition 0|Group 0|Group 1,Condition 1,Condition 2|Group 0|Group 1|Group 2,Condition 3
SampleName0,1,A,0,Aa
SampleName1,0,A,2,Bb
SampleName2,1,B,1,Cc
```

---

**intracohort_data.csv** should be a csv with the first column including sample names (corresponding to meta.csv), 
the second column for breaking up each sample into chains, and remaining columns for different functions on those chains.
Not all chains need to be included for the csv to parsed.

intracohort_data.csv template:
```
sample,chain,CDR3 Length,Raw Diversity,Shannon Entropy Measure,1 / Shannon Entropy Measure,Gini Coefficient,Gini-Simpson Index,Unique CDR3 Count
SampleName0,TRB,45.47,2.93,0.45,2.23,0.36,0.74,6
SampleName0,TRA,41.5,5.21,0.38,2.64,0.25,0.83,7
SampleName0,IGH,52.18,11.92,0.25,3.96,0.44,0.93,20
SampleName0,IGL,36.87,8.76,0.23,4.36,0.58,0.93,34
SampleName0,IGK,33.26,8.08,0.2,5.02,0.66,0.94,75
SampleName1,TRB,42.9,10.18,0.21,4.87,0.48,0.95,45
SampleName1,TRA,39.42,10.09,0.24,4.2,0.45,0.93,26
SampleName1,TRG,32.18,2.98,0.5,2,0.33,0.71,5
SampleName1,IGH,54.54,16.36,0.18,5.5,0.72,0.96,115
SampleName1,IGL,38.86,15.43,0.17,5.87,0.76,0.96,215
SampleName1,IGK,33.35,14.99,0.17,5.88,0.85,0.96,403
SampleName2,TRB,42.58,3.74,0.36,2.78,0.39,0.81,9
SampleName2,TRA,41.1,8.9,0.29,3.5,0.29,0.9,13
SampleName2,IGH,63.51,4.11,0.3,3.31,0.85,0.82,45
SampleName2,IGL,35.3,2.27,0.27,3.71,0.86,0.72,153
SampleName2,IGK,32.71,3.38,0.23,4.28,0.87,0.82,279
```

---

**info.csv** files aren't required to have a particular structure and can be populated with whatever info the user desires. 
The leftmost column displays in bold.

---

**ImmuneRepProcess.R** can be run to generate static figures, intracohort_data.csv, and sample_list.csv.

Usage:
```
Rscript immuneRepProcess.R config.R
```

**config.R** is used to adjust the parameters of ImmuneRepProcess.R and a template is included.
Support is included for TRUST4, MiXCR, and Adaptive clonesets.

---

**cohort_list.csv** can optionally be placed in this directory in order to enable shortcuts to different cohort selections.
These shortcuts appear under 'Cohort Path Selection' above.

cohort_list.csv template:
```
path/to/cohort1,Cohort 1
path/to/cohort2,Cohort 2
```