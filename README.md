## **V**isualiz**IRR** (**V**isualized **I**mmune **R**epertoire **R**eport)

### v0.4.1

An in-browser immune repertoire report, incorporating popular web development libraries, including jQuery, Bootstrap, and plotly.js, in order to make immune repertoire analysis results simple to navigate and understand for the end user on their local machine or on a server.
These reports are structured to dynamically display the results of whatever cohort you run TCR/BCR analysis on.
All you need to do is run an R script on a directory of clonesets and prepare your meta information according to specifications detailed by the documentation.
An included config file template walks the user through the process and helps them customize their report.
Support is included for TRUST4, MiXCR, VDJtools, Adaptive, and custom clonesets.

---

**Information in Report**

* Cohort and sample level 
    * Segment Usage
        * V gene and J gene usage
        * Combined V and J gene usage
        * C gene usage for IGH, D gene usage for IGH/TRB/TRD
    * CDR3 Info
        * Amino acid length distribution
        * Nucleotide length distribution
        * Top clonotypes 
* Cohort Analysis
    * Intracohort Analysis, Paired Sample Cohort Analysis, Cohort Information Table, Cohort Scatterplot
        * Raw Diversity, Entropy, 1/Entropy, Normalized Entropy, Gini Coefficient, Gini-Simpson Index, Inverse Simpson Index, Chao1 Index, CPK, Clonal Proportion, Cumulative Proportion Clonotypes, Clonality, Average CDR3 Length (Nt), Unique CDR3 Count (Nt), Unique CDR3 Count (AA)
        * Annotation database overlap analysis
    * Comparison between sub-cohort groups
* Everything is split between different available chains 
    * TRB, TRA, TRG, TRD, IGH (+ Isotypes), IGL, IGK

For more details on the contents of the generated report, check the **home&#46;md** file which is displayed on the report homepage and contains more in-depth information on different sections.

---

**Viewing Report on a Local Machine**

For security purposes, newer browsers can have problems loading local files normally in an HTML page.
If you can't view the the display locally by simply opening the html in a browser, you can perform the following in your terminal to set up a simple server and view the report:
```
cd <VisualizIRR_directory>
```
Python 2:
```
python -m SimpleHTTPServer & python -m webbrowser -n "http://0.0.0.0:8000"
```
Python 3:
```
python3 -m http.server & python3 -m webbrowser -n "http://0.0.0.0:8000"
```

The report is viewable at http://0.0.0.0:8000, which should pop up automatically.

---

**Setting up Display from a Cloneset**

**config.R** needs to be properly configured and then **ImmuneRepProcess.R** needs to be run using it as input. 

**meta.csv** is required for intracohort analysis and is the only component of the final report that needs to be manually composed by the end-user.

**info.csv** can optionally be set up to include additional meta information for each sample as well as on the cohort level.

Read the below sections for more detailed information on each of these components.

---

**ImmuneRepProcess.R** can be run to generate figures, intracohort_data.csv, and sample_list.csv.

Usage:
```
Rscript immuneRepProcess.R config.R
```

---

**config.R** is used to adjust the parameters of ImmuneRepProcess.R and a template with descriptions of each field is included that helps to guide the user.
Support is included for TRUST4, MiXCR, Adaptive, and custom clonesets.

* Three fields are required (input format, input directory, output directory).
* There are additional optional fields for the user to specify how the results are generated.
    * Defining the prefix/suffix of the input files is recommended.
    * cohort_list.csv (see below for more info) can automatically generated and modified
    * Chains (TRB, TRA, TRG, TRD, IGH, IGL, IGK) to be analyzed can be defined.
    * Different features of the output figures can be defined.
    * Components of the report to be produced can be adjusted.
    * Custom input format can be defined.

---

**meta.csv** should be a csv with the first column including sample names (named "sample") and remaining columns for different conditions. 
Sample names must correspond to the names of the input repertoire files with prefix and/or suffix stripped according to the input_prefix and input_suffix values defined in config.R. 
This can be further checked by comparing these to the sample names in the intracohort_data.csv file generated for the report.
There are a few ways to enter your meta information, but in order to have ordered sample condition groups one can use a numeric range and denote 
the categorical label of those groups in the header using '|' as the seperator (as demonstrated in condition 0 and 2). 
In Condition 0, Group 0 = 0 and Group 1 = 1.
You can also use the labels in the metasheet and not denote them in the header (as demonstrated in condition 1 and 3).
Meta-data should be converted to categorical bins if it isn't categorical already.

meta.csv template 1:
```
sample,Condition 0|Group 0|Group 1,Condition 1,Condition 2|Group 0|Group 1|Group 2,Condition 3
SampleName0,1,A,0,Aa
SampleName1,0,A,2,Bb
SampleName2,1,B,1,Cc
```

In order to set up paired sample analysis, a column must be named 'VisGroup' and another named 'Timepoint'.
The VisGroup column contains patient IDs and the Timepoint column contains different timepoints. 
These can be utilized together to conduct paired sample analysis. 
Below we see two samples with the VisGroup value Patient1. 
They have two different timepoints (0 and 1) and therefore will be paired accordingly.

meta.csv template 2:
```
sample,Condition 0|Group 0|Group 1,Timepoint|Pre|Post,VisGroup
SampleName0,0,0,Patient1
SampleName1,0,1,Patient1
SampleName2,1,0,Patient2
SampleName3,1,1,Patient2
```

---

**info.csv** files are optional and aren't required to have a particular structure and can be populated with whatever info the user desires. 
These files may be placed in any subdirectory within your dataset directory, generated by ImmuneRepProcess.R, in order to be displayed on the cohort or sample level under the Information tab.
The leftmost column displays in bold.

---

**cohort_list.csv** can optionally be placed in this directory in order to enable shortcuts to different cohort selections.
The default data path used for the report is 'data/' if cohort_list.csv hasn't been implemented. If you wish to change this path for the current session, you may do so at the top of the home page.
These shortcuts appear under 'Cohort Path Selection' above. ImmuneRepProcess.R has an option to automatically update this list when running new cohorts.

cohort_list.csv template:
```
path/to/cohort1,Cohort 1
path/to/cohort2,Cohort 2
```

---

**db_table.csv** is a table containing TCR sequences associated with a target antigen or related to a specific pathology. They are sourced from VDJdb and McPAS-TCR which contains sequences curated from existing literature. 
**db_table_cancer_list.csv** contains a list of cancer associated annotations.

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
It will be processed the same as the others in the report.

**db_data.csv** is formatted the same way as intracohort_data.csv and is integrated into the report, when available, alongside intracohort_data.csv. It contains sample repertoire CDR3 overlaps with db_table.csv, weighted by the frequency of the CDR3s in the repertoire of the samples. CDR3 overlaps are grouped into top cancer/non-cancer annotation categories, a cancer sum category, and a misc sum category.

---

**sample_list.csv** needs to contain a newline seperated list of sample directory names.

sample_list.csv template:
```
SampleName0
SampleName1
SampleName2
```
