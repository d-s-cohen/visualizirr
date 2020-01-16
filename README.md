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
│   │   ├── cdr3ntLength.png
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

**Information in Report**

* Cohort and sample level 
    * Segment Usage
        * V gene and J gene usage
        * Combined V and J gene usage 
    * CDR3 Info
        * Amino acid length distribution
        * Nucleotide length distribution
        * Top clonotypes
    * User customized meta information 
* Intracohort Analysis
    * Diversity and clonality measures
        * CDR3 Length, Raw Diversity, Shannon Entropy Measure, 1 / Shannon Entropy Measure, Gini Coefficient, Gini-Simpson Index, Inverse Simpson Index, Chao1 Index, Unique CDR3 Count
        * Comparison between sub-cohort groups of these measures
* Everything is split between different chains 
    * TRB, TRA, TRG, TRD, IGH, IGL, IGK

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
sample,chain,CDR3 Length,Raw Diversity,Shannon Entropy Measure,1 / Shannon Entropy Measure,Gini Coefficient,Gini-Simpson Index,Inverse Simpson Index,Chao1 Index,Unique CDR3 Count
SampleName0,TRB,45.4737,2.9321,2.234,0.4476,0.3596,0.7424,3.8817,6.9474,6
SampleName0,TRA,41.5,5.2083,2.6416,0.3786,0.254,0.8272,5.7857,8.8889,7
SampleName0,IGH,52.1838,11.9151,3.9613,0.2524,0.438,0.9275,13.7923,23.9951,20
SampleName0,IGL,36.8694,8.7584,4.3559,0.2296,0.5775,0.928,13.8959,37.6653,34
SampleName0,IGK,33.2624,8.0779,5.0241,0.199,0.6614,0.9378,16.0727,101.0339,75
SampleName1,TRB,42.8963,10.1811,4.8674,0.2054,0.4751,0.9469,18.8347,55.8225,45
SampleName1,TRA,39.4239,10.0928,4.2038,0.2379,0.4515,0.9296,14.2013,34.012,26
SampleName1,TRG,32.1818,2.9768,2.0049,0.4988,0.3273,0.7107,3.4571,7.7273,5
SampleName1,IGH,54.5441,16.3617,5.5002,0.1818,0.7249,0.9633,27.2493,143.8969,115
SampleName1,IGL,38.8631,15.4276,5.8725,0.1703,0.7615,0.9632,27.1583,244.8357,215
SampleName1,IGK,33.3506,14.9937,5.8826,0.17,0.8477,0.9581,23.8882,550.0341,403
SampleName2,TRB,42.5769,3.7416,2.7759,0.3602,0.3932,0.8136,5.3651,11.1635,9
SampleName2,TRA,41.1,8.9017,3.4981,0.2859,0.2872,0.9022,10.2273,19.0417,13
SampleName2,IGH,63.5094,4.1071,3.3117,0.302,0.8537,0.8248,5.7078,67.56,45
SampleName2,IGL,35.2986,2.2675,3.7059,0.2698,0.8553,0.7198,3.5692,181.3025,153
SampleName2,IGK,32.707,3.3842,4.2796,0.2337,0.866,0.8199,5.5511,394.038,279
```

Due to the nature of this format, you may append any column you like as an additional function for comparison in the analysis. 
It will be processed the same as the others.

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
Support is included for TRUST4, MiXCR, Adaptive, and custom clonesets.

---

**cohort_list.csv** can optionally be placed in this directory in order to enable shortcuts to different cohort selections.
These shortcuts appear under 'Cohort Path Selection' above.

cohort_list.csv template:
```
path/to/cohort1,Cohort 1
path/to/cohort2,Cohort 2
```