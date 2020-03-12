################
#### CONFIG ####
################

# Specify input format so that files may be parsed appropriately
# Accepted formats: "TRUST4", "MIXCR", "ADAPTIVE", "CUSTOM"
input_format = "TRUST4"

# Change to your directory containing input cdr3.out files
input_dir = "~/in"

# Change to path where you wish to store output figures
output_dir = "~/out"

# Name and path of cohort (for modifying cohort list)
output_name = "Cohort"

# Path of report (for modifying cohort list)
report_dir = "~/ImmuneRepVis/"

# Chains to search for (less chains = shorter runtime) - Options: TRB, TRA, TRG, TRD, IGH, IGL, IGK
chains_search = c("TRB", "TRA", "TRG", "TRD", "IGH", "IGL", "IGK")

# Prefix of files, suffix of files (both are removed from output)
file_prefix = "TRUST_"
file_suffix = "_cdr3.out"

# Sum barplots - maximum number of both V or J genes
sumMax = 10

# VJ stack barplots - maximum number of both V and J genes
vjMax = 5

# CDR3 nucleotides length barplots - Maximum number of clonotypes to display
clonotypeMax = 8

# Clonotype abundancies to include in intracohort analysis - Enter a vector of CDR3 Amino Acids (OPTIONAL)
#clonotypeAbundance = c()

# Components to run
sample_level_run = TRUE
cohort_level_run = TRUE
intracohort_run = TRUE

#####################
# CUSTOM INPUT FORMAT
# This applies if "CUSTOM" was selected as format
# Must be TSV
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
