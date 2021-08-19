# This script is used to generate the DB files used by VisualizIRR, merged from the mcpas-tcr and vdjdv DBs

mcpas <- read.csv("McPAS-TCR.csv", stringsAsFactors=FALSE)[,c(2,3,5,22,24,4)]
mcpas <- mcpas[mcpas$Species=='Human',]
mcpas <- mcpas[!is.na(mcpas$Pathology),]
mcpas <- mcpas[!is.na(mcpas$CDR3.beta.aa),]
mcpas <- mcpas[,c(1,3,4,5,6)]
mcpas$Pathology[mcpas$Pathology == "M.Tuberculosis"] <- "M. tuberculosis" 
mcpas$Pathology[mcpas$Pathology == "Cervical carcinoma"] <- "Cervical cancer"
colnames(mcpas) <- c("CDR3_AA","species_pathology",'V_gene','J_gene','Category')
mcpas <- mcpas[c('CDR3_AA','V_gene','J_gene','species_pathology','Category')]

cancer_list <- unique(mcpas[c('species_pathology','Category')])[unique(mcpas[c('species_pathology','Category')])$Category  == 'Cancer',]$species_pathology

write.csv(cancer_list,'db_table_cancer_list.csv',quote=T,row.names=F)

mcpas <- read.csv("McPAS-TCR.csv", stringsAsFactors=FALSE)[,c(2,3,5,22,24)]
mcpas <- mcpas[mcpas$Species=='Human',]
mcpas <- mcpas[!is.na(mcpas$Pathology),]
mcpas <- mcpas[!is.na(mcpas$CDR3.beta.aa),]
mcpas <- mcpas[,c(1,3,4,5)]
mcpas$Pathology[mcpas$Pathology == "M.Tuberculosis"] <- "M. tuberculosis" 
colnames(mcpas) <- c("CDR3_AA","species_pathology",'V_gene','J_gene')
mcpas <- mcpas[c('CDR3_AA','V_gene','J_gene','species_pathology')]

vdjdb <- read.delim("vdjdb.slim.txt", stringsAsFactors=FALSE)[,c(1,2,3,6,8,9)]
vdjdb <- vdjdb[vdjdb$species == 'HomoSapiens',]
vdjdb <- vdjdb[vdjdb$gene == 'TRB',]
vdjdb <- vdjdb[c('cdr3','v.segm','j.segm','antigen.species')]
colnames(vdjdb) <- c('CDR3_AA','V_gene','J_gene','species_pathology')
vdjdb$V_gene <- sapply(strsplit(as.character(vdjdb$V_gene), "[*]") , "[", 1)
vdjdb$J_gene <- sapply(strsplit(as.character(vdjdb$J_gene), "[*]") , "[", 1)

vdjdb$species_pathology[vdjdb$species_pathology == "EBV"] <- "Epstein Barr virus (EBV)"
vdjdb$species_pathology[vdjdb$species_pathology == "CMV"] <- "Cytomegalovirus (CMV)"
vdjdb$species_pathology[vdjdb$species_pathology == "HIV-1"] <- "Human immunodeficiency virus (HIV)"
vdjdb$species_pathology[vdjdb$species_pathology == "HCV"] <- "Hepatitis C virus (HCV)" 
vdjdb$species_pathology[vdjdb$species_pathology == "InfluenzaA"] <- "Influenza"
vdjdb$species_pathology[vdjdb$species_pathology == "YFV"] <- "Yellow fever virus"
vdjdb$species_pathology[vdjdb$species_pathology == "SARS-CoV-2"] <- "COVID-19"
vdjdb$species_pathology[vdjdb$species_pathology == "HPV"] <- "Human papilloma virus"
vdjdb$species_pathology[vdjdb$species_pathology == "M.tuberculosis"] <- "M. tuberculosis"
vdjdb$species_pathology[vdjdb$species_pathology == "HSV-2"] <- "Herpes simplex virus 2 (HSV2)"

mcpas$species_pathology[mcpas$species_pathology == "Cervical carcinoma"] <- "Cervical cancer"

# include v and j gene
#db_table <- rbind(vdjdb,mcpas)
# dont include v and j gene
db_table <- rbind(vdjdb[,c(1,4)],mcpas[,c(1,4)])

db_table <- db_table %>% distinct()





write.csv(db_table,'db_table.csv',quote=T,row.names=F)
