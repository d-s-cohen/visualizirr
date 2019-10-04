Structure of data folder (include in this directory):

```
data
├── All
│   ├── cohortAnalysis
│   │   ├── all_sample_PCA.png
│   │   ├── BCR_evenness.png
│   │   ├── BCR_richness.png
│   │   ├── naive0_PCA.png
│   │   ├── naive1_PCA.png
│   │   ├── TCR_evenness.png
│   │   └── TCR_richness.png
│   ├── IGH
│   │   ├── cdr3aaLength.png
│   │   ├── fancyspectra.png
│   │   ├── fancyvj.wt.png
│   │   ├── jsumBarplot.png
│   │   ├── rankFrequency.png
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
└── sample_list.csv
```

All IGH, IGK, IGL, TRA, TRB, TRD, and TRG directories (sample level and cohort level) 
should contain all the files shown under the data>All>IGH directory shown above.

sample_list.csv needs to contain a newline seperated list of sample directory names.
