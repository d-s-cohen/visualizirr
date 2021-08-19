################
#### CONFIG ####
################

### REQUIRED ###

# Specify input format so that files may be parsed appropriately
# Accepted formats: "TRUST4" (cdr3.out files), "TRUST4_SIMPLE" (report.out files), "VDJTOOLS", "MIXCR", "ADAPTIVE", "RHTCRSEQ", "CUSTOM"
input_format = "TRUST4"

# Change to your directory containing input files
input_dir = "~/in"

# Change to path where you wish to store output figures
output_dir = "~/out"

### OPTIONAL ###

# Prefix and suffic of input files (both are removed from output) (RECOMMENDED) (DEFAULT: "")
input_prefix = "TRUST_"
input_suffix = "_cdr3.out"

# Name/path of cohort (for modifying cohort list) (DEFAULT: paste("Cohort", Sys.Date()))
output_name = "Cohort"

# Path of report (for modifying cohort list) (DEFAULT: NULL)
report_dir = "~/ImmuneRepVis/"

# Chains to search for (less chains = shorter runtime) (Options: TRB, TRA, TRG, TRD, IGH, IGL, IGK) (DEFAULT: c("TRB", "TRA", "TRG", "TRD", "IGH", "IGL", "IGK"))
chains_search = c("TRB", "TRA", "TRG", "TRD", "IGH", "IGL", "IGK")

# Sum barplots - maximum number of both V or J genes (DEFAULT: 10)
sumMax = 10

# VJ stack barplots - maximum number of both V and J genes (DEFAULT: 5)
vjMax = 5

# CDR3 nucleotides length barplots - Maximum number of clonotypes to display (DEFAULT: 8)
clonotypeMax = 8

# Clonotype abundancies to include in intracohort analysis - Enter a vector of CDR3 Amino Acids (DEFAULT: NULL)
#clonotypeAbundance = c()

# Produce corresponding JSON files of report information for samples
#json_out = FALSE

# Directory containing db data (db_table.csv, db_table_cancer_list.csv)
# End in /, Leave blank if files are in current directory
# db_data_dir = ''

# Components to run (DEFAULT: TRUE)
# Sample level CDR3 distribution + gene usage plots
sample_level_run = TRUE
# Cohort level CDR3 distribution + gene usage plots
cohort_level_run = TRUE
# Cohort diversity analysis
intracohort_run = TRUE
# Cohort annotation database analysis
db_run = TRUE

#####################
# CUSTOM INPUT FORMAT
# This applies if "CUSTOM" was selected as format
#####################
# Whether or not input contains a header
#custom_header = TRUE
# Column number containing cdr3 nucleotide sequence
#custom_cdr3 = 1
# Column number containing Vgene
#custom_v = 2
# Column number containing Dgene
#custom_d = 3
# Column number containing Jgene
#custom_j = 4
# Column number containing Cgene
#custom_c = 5
# Column number containing clonotype count
#custom_count = 6
# Custom seperator, don't change if input is TSV
# custom_sep = ''