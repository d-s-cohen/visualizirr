#### **V**isualiz**IRR** (**V**isualized **I**mmune **R**epertoire **R**eport)

An in-browser immune repertoire report, incorporating popular web development libraries, including jQuery, Bootstrap, and plotly.js, in order to make immune repertoire analysis results simple to navigate and understand for the end user.

The immune repertoire is composed of T-cell receptors and B-cell receptors, which help the immune system recognize pathogens. Analysis of the immune repertoire helps us understand the functionality of the immune system, particularly in the face of disease and treatment. 

VisualizIRR collects immune repertoire data from immunotherapy cohorts of differing formats, including TCR-seq, BCR-seq, and RNA-seq data.

---

**Getting Started**

Cohort Selection is available on the home page. 
From there, the user can use the top navigation bar to view segment usage and CDR3 distribution information on either the cohort level or the individual sample level, depending on what they select from the drop-down menu. 

Cohort analysis is available in which users can compare the distributions of immune repertoire features of samples among differing groups and subgroups within the cohort. 
This includes an intracohort anlaysis module which produces Wilcoxon rank-sum test p-values. An associated heatmap is available with all measures and utilizes IQR based normalization.
This also includes a paired sample cohort analysis which produces Wilcoxon signed-rank test p-values. An associated heatmap is available with all measures and utilizes log2 fold change between timepoints.
Heatmap samples are organized based on user-selected groupings and subgroupings. Samples are further sorted by the values of the metric selected.
There is also a table of the values and a scatterplot for comparing different measures.
Cohort statistics data and available meta-information are available on the cohort analysis page in tables and are downloadable.
The cohort can be subsetted by the user based on metadata and/or individual sample seleciton.

The data for all figures is split into different available chains. All figures produced by VisualizIRR can be exported in raster or vector format. 

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

---

**Cohort Analysis - Diversity**

* Raw Diversity
    * Number of equally-abundant types needed for the average proportional abundance of the types to equal that observed in the dataset of interest where all types may not be equally abundant
* Entropy
    * Shannon entropy measure
* 1/Entropy
    * 1 / Shannon entropy measure
* Normalized Entropy
    * Shannon entropy measure - Normalised by the maximal value of the entropy
* Gini Coefficient
    * A measure of statistical dispersion representing inequality among values of a frequency distribution
* Gini-Simpson Index
    * The probability of two random entities representing different types
* Inverse Simpson Index
    * The effective number of types that is obtained when the weighted arithmetic mean is used to quantify average proportional abundance of types in the dataset of interest
* Chao1 Index
    * A nonparameteric asymptotic estimator of species richness
* CPK
    * (Unique CDR3 count / Total reads) * 1000
* Clonal Proportion
    * Relative abundance for a number of top clonotypes in the repertoire
* Cumulative Proportion Clonotypes
    * Clonotype quantity occupying a top percentage of the repertoire
* Clonality
    * Normalized entropy over the number of unique clones 
* Average CDR3 Length (Nt)
* Unique CDR3 Count (Nt)
* Unique CDR3 Count (AA)

**Cohort Analysis - Annotation**

Annotation analysis utilizes TCR sequences associated with a target antigen or related to a specific pathology. 
They are sourced from VDJdb and McPAS-TCR which contain sequences curated from existing literature. 
Overlapping hits are weighted by the frequency of abundance of these CDR3s in the immune repertoire of the samples.
Top antigen/pathology-specific overlaps are reported. 
The cancer_sum overlap contains the sum of all cancer associated overlaps. 
The misc_sum overlap contains the sum of all associated sequence overlaps which are not individually contained in the report.
