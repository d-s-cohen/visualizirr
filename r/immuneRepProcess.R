#!/usr/bin/env Rscript
args = commandArgs(trailingOnly=TRUE)

# CONFIG DEFAULTS 
sample_level_run = TRUE
cohort_level_run = TRUE
intracohort_run = TRUE
db_run = TRUE
chains_search = c("TRB", "TRA", "TRG", "TRD", "IGH", "IGL", "IGK")
input_prefix = ""
input_suffix = ""
sumMax = 10
vjMax = 5
clonotypeMax = 8
clonotypeAbundance = NULL
custom_c = NULL
custom_d = NULL
custom_sep = ""
report_dir = NULL
output_name = paste("Cohort", Sys.Date())
json_out = FALSE
process_col = "aa"
null_values = c('*','','.','unresolved')
cdr3nt_skip = FALSE
db_data_dir = ''

# Command line arguments

if (length(args)==0) {
  if(file.exists("config.R")){
    source("config.R")
  } else {
    stop("'Usage: Rscript immuneRepProcess.R config.R'", call.=FALSE)
  }
} else if (length(args)==1) {
  source(args[1])
} else {
  stop("'Usage: Rscript immuneRepProcess.R config.R'", call.=FALSE)
}

if (!(exists("input_format") & exists("input_dir") & exists("output_dir"))) {
  stop("'Define input_format, input_dir, and output_dir in config file'", call.=FALSE)
}

# Package setup

list.of.packages <- c("data.table","immunarch","naturalsort","dplyr")

if (json_out == TRUE) {
  list.of.packages <- append(list.of.packages,"rjson")
}

new.packages <- list.of.packages[!(list.of.packages %in% installed.packages()[,"Package"])]
if(length(new.packages)) install.packages(new.packages, repos = "http://cran.us.r-project.org")

suppressMessages(library(data.table))
suppressMessages(library(immunarch))
suppressMessages(library(naturalsort))
suppressMessages(library(dplyr))
if (json_out == TRUE) {
  suppressMessages(library(rjson))
}

if (!"Biostrings" %in% installed.packages()[,"Package"]){
  if (!requireNamespace("BiocManager", quietly = TRUE))
    install.packages("BiocManager", repos = "http://cran.us.r-project.org")
  BiocManager::install("Biostrings")
}
suppressMessages(library(Biostrings))

# Intracohort analysis functions setup

intracohortColNames = c("sample", "chain", "Raw Diversity", "Entropy", "1/Entropy", "Normalized Entropy", "Gini Coefficient","Gini-Simpson Index","Inverse Simpson Index","Chao1 Index", "CPK",
                        "Clonal Proportion (Top 10)", "Clonal Proportion (Top 100)", "Clonal Proportion (Top 1000)", "Cumulative Proportion Clonotypes (Top 10%)", "Cumulative Proportion Clonotypes (Top 50%)", "Clonality",
                        "Average CDR3 Length (Nt)", "Unique CDR3 Count (Nt)", "Unique CDR3 Count (AA)")

if (input_format == "RHTCRSEQ" || cdr3nt_skip == TRUE) {
  intracohortColNames = intracohortColNames[-19]
}

functionNum = length(intracohortColNames)
functionNumClonotype = functionNum + length(clonotypeAbundance)

intracohort_values_template <- data.frame(matrix(ncol = functionNumClonotype, nrow = 0))

if (length(clonotypeAbundance)>0) {
  colnames(intracohort_values_template) <- c(intracohortColNames,paste(clonotypeAbundance, "(Freq*1000)", sep=" "))
} else {
  colnames(intracohort_values_template) <- intracohortColNames
}

isotype_list <- c('IGHA1', 'IGHA2', 'IGHD', 'IGHE', 'IGHG1', 'IGHG2', 'IGHG3', 'IGHG4', 'IGHM')

if (db_run == TRUE){
  db_table <- read.csv(paste(db_data_dir,"db_table.csv",sep=""), stringsAsFactors=FALSE)
  cancer_list <- read.csv(paste(db_data_dir,"db_table_cancer_list.csv",sep=""), sep="", stringsAsFactors=FALSE)[,1]

  db_result <- data.frame(matrix(ncol = length(unique(db_table$species_pathology)), nrow = 0),stringsAsFactors = FALSE)
  colnames(db_result) <- unique(db_table$species_pathology)
  sample_list_db <- vector()
}

# File list

input_dir = sub("/$","",input_dir)
output_dir = sub("/$","",output_dir)
if (!is.null(report_dir)) {
  report_dir = sub("/$","",report_dir)
}

files <-
  list.files(
    path = input_dir,
    pattern = paste("^",input_prefix,".*",input_suffix,"$",sep=""),
    full.names = F,
    recursive = F
  )

files <- gsub(paste("(",input_prefix,"|",input_suffix,"$)",sep=""),"", files)

dir.create(output_dir, showWarnings = FALSE)

if (sample_level_run == TRUE || intracohort_run == TRUE || db_run == TRUE) {
  
  if (sample_level_run == TRUE) {
    sample_list <- vector()
  }
  
  for (current_sample in files) {
    
    if (sample_level_run == TRUE) {
      if (match(current_sample,files) == 1) {print(paste(Sys.time(),"Generating sample-level figures"))}
    }
    if (sample_level_run == TRUE && intracohort_run == TRUE) {
      if (match(current_sample,files) == 1) {print("&")}
    }  
    if (intracohort_run == TRUE) {
      if (match(current_sample,files) == 1) {print(paste(Sys.time(),"Generating diversity intracohort analysis table"))}
    }  
    if ((sample_level_run == TRUE || intracohort_run == TRUE) && (db_run == TRUE)) {
      if (match(current_sample,files) == 1) {print("&")}
    }  
    if (db_run == TRUE) {
      if (match(current_sample,files) == 1) {print(paste(Sys.time(),"Generating DB intracohort analysis table"))}
    }      
    
    print(paste(Sys.time(),"Sample",match(current_sample,files),"/",length(files),"-",current_sample))
    
    # TRUST4 file format
    
    if (input_format == "TRUST4") {
      
      sample_table <-
        read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = F)
      
      if (ncol(sample_table) == 10) {
        colnames(sample_table) <-
          c(
            "consensus_id",
            "index_within_consensus",
            "V_gene",
            "J_gene",
            "C_gene",
            "CDR1",
            "CDR2",
            "CDR3",
            "CDR3_score",
            "read_fragment_count"
          )
      } else if (ncol(sample_table) == 11) {
        colnames(sample_table) <-
          c(
            "consensus_id",
            "index_within_consensus",
            "V_gene",
            "D_gene",
            "J_gene",
            "C_gene",
            "CDR1",
            "CDR2",
            "CDR3",
            "CDR3_score",
            "read_fragment_count"
          )
      } else if (ncol(sample_table) == 12) {
        colnames(sample_table) <-
          c(
            "consensus_id",
            "index_within_consensus",
            "V_gene",
            "D_gene",
            "J_gene",
            "C_gene",
            "CDR1",
            "CDR2",
            "CDR3",
            "CDR3_score",
            "read_fragment_count",
            "CDR3_germline_similarity"
          )
      }
      
      # remove partials
      sample_table <- sample_table[(sample_table$CDR3_score != 0.00), ]
      
      sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))
      
      sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), ",") , "[", 1)
      
    }       
    
    # TRUST4_SIMPLE file format
    
    else if (input_format == "TRUST4_SIMPLE") {
      
      sample_table <-
        read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = T)
      
      colnames(sample_table)[which(names(sample_table) == "V")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "D")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "J")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "C")] <- "C_gene"
      colnames(sample_table)[which(names(sample_table) == "CDR3nt")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "CDR3aa")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "X.count")] <- "read_fragment_count"
      
        # remove partials
        sample_table <- sample_table[(sample_table$CDR3_AA != "partial"), ]
      
    } 
    
    # VDJTOOLS file format
    
    else if (input_format == "VDJTOOLS") {
      
      sample_table <-
        read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = T)
      
      colnames(sample_table)[which(names(sample_table) == "v")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "d")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "j")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "c")] <- "C_gene"
      colnames(sample_table)[which(names(sample_table) == "cdr3nt")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "cdr3aa")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "count")] <- "read_fragment_count"
      
    } 
    
    # MIXCR file format
    
    else if (input_format == "MIXCR") {
      
      sample_table <- read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = T)
      
      colnames(sample_table)[which(names(sample_table) == "allVHitsWithScore")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "allDHitsWithScore")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "allJHitsWithScore")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "allCHitsWithScore")] <- "C_gene"
      colnames(sample_table)[which(names(sample_table) == "nSeqCDR3")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "aaSeqCDR3")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "cloneCount")] <- "read_fragment_count"
      
    } 
    
    # ADAPTIVE file format
    
    else if (input_format == "ADAPTIVE") {
      
      sample_table <- read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = T)
      
      if ("v_gene" %in% colnames(sample_table)) {
        
        adaptive_counts = "templates"
        
        if (all(is.na(sample_table$template))) {adaptive_counts <- "seq_reads"}
        
        sample_table <- sample_table[c("v_gene","d_gene","j_gene","rearrangement","amino_acid",adaptive_counts,"v_index","cdr3_length")]
        
        colnames(sample_table)[which(names(sample_table) == "v_gene")] <- "V_gene"
        colnames(sample_table)[which(names(sample_table) == "d_gene")] <- "D_gene"
        colnames(sample_table)[which(names(sample_table) == "j_gene")] <- "J_gene"
        colnames(sample_table)[which(names(sample_table) == "rearrangement")] <- "CDR3"
        colnames(sample_table)[which(names(sample_table) == "amino_acid")] <- "CDR3_AA"
        colnames(sample_table)[which(names(sample_table) == adaptive_counts)] <- "read_fragment_count"
        
      } else if ("vGeneName" %in% colnames(sample_table)) {
        
        if ("count..templates.reads." %in% colnames(sample_table)) {
          colnames(sample_table)[which(names(sample_table) == "count..templates.reads.")] <- "read_fragment_count"
        } else if ("count..templates." %in% colnames(sample_table)) {
          colnames(sample_table)[which(names(sample_table) == "count..templates.")] <- "read_fragment_count"
        }
        
        sample_table <- sample_table[c("vGeneName","dGeneName","jGeneName","nucleotide","aminoAcid","read_fragment_count","vIndex","cdr3Length")]
      
        colnames(sample_table)[which(names(sample_table) == "vGeneName")] <- "V_gene"
        colnames(sample_table)[which(names(sample_table) == "dGeneName")] <- "D_gene"
        colnames(sample_table)[which(names(sample_table) == "jGeneName")] <- "J_gene"
        colnames(sample_table)[which(names(sample_table) == "nucleotide")] <- "CDR3"
        colnames(sample_table)[which(names(sample_table) == "aminoAcid")] <- "CDR3_AA"
        
        colnames(sample_table)[which(names(sample_table) == "vIndex")] <- "v_index"
        colnames(sample_table)[which(names(sample_table) == "cdr3Length")] <- "cdr3_length"
        
      }
      
      if (cdr3nt_skip == TRUE){
        
        sample_table <- sample_table[ , !(names(sample_table) %in% c("v_index","cdr3_length","CDR3"))]
        
      } else {
      
        sample_table[,"CDR3"] <- as.character(sample_table[,"CDR3"])
        
        for(i in 1:nrow(sample_table)) {
          row <- sample_table[i,]
          cdr3_nt <- substr(row$CDR3,row$v_index+1,row$v_index+row$cdr3_length)
          sample_table[i,"CDR3"] <- cdr3_nt
          
        }
        
        sample_table <- sample_table[ , !(names(sample_table) %in% c("v_index","cdr3_length"))]
      
      }
      
      sample_table$V_gene <- gsub('TCR', 'TR', sample_table$V_gene)      
      sample_table$D_gene <- gsub('TCR', 'TR', sample_table$D_gene)    
      sample_table$J_gene <- gsub('TCR', 'TR', sample_table$J_gene) 
      
    } 
    
    # RHTCRSEQ file format
    
    else if (input_format == "RHTCRSEQ") { 
      
      sample_table_trb <- read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = T, sep = ',')[c('v_hit','j_hit','cdr3','count_sum')] 
      input_suffix_tra <- gsub("TRB","TRA",input_suffix)
      sample_table_tra <- read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix_tra, sep = ""), header = T, sep = ',')[c('v_hit','j_hit','cdr3','count_sum')]
      
      sample_table <- rbind(sample_table_trb,sample_table_tra)
      
      colnames(sample_table)[which(names(sample_table) == "v_hit")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "j_hit")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "cdr3")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "count_sum")] <- "read_fragment_count"
      
    } 
    
    # CUSTOM file format
    
    else if (input_format == "CUSTOM") {
      
      sample_table <- read.delim(paste(input_dir,"/",input_prefix,current_sample,input_suffix, sep = ""), header = custom_header, sep = custom_sep)     
      
      colnames(sample_table)[custom_cdr3] <- "CDR3"
      colnames(sample_table)[custom_v] <- "V_gene"
      colnames(sample_table)[custom_j] <- "J_gene" 
      if (!is.null(custom_c)){
        colnames(sample_table)[custom_c] <- "C_gene"
      }
      if (!is.null(custom_d)){
        colnames(sample_table)[custom_d] <- "D_gene"
      }
      colnames(sample_table)[custom_count] <- "read_fragment_count"
      
      sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))
      
    }
    
    if (dim(sample_table)[1] != 0) {
      
      if (json_out == TRUE) {
        json_base <- vector(mode = "list")
      }
      
      if (sample_level_run == TRUE) {
        sample_list <- append(sample_list,current_sample)
        dir.create(paste(output_dir,current_sample,sep="/"), showWarnings = FALSE)
      }
      
      # Clean V,D,J,C-genes
      
      if (input_format %in% c("MIXCR","TRUST4","TRUST4_SIMPLE","VDJTOOLS")){
        sample_table$V_gene <- sapply(strsplit(as.character(sample_table$V_gene), "[*]") , "[", 1)
        sample_table$J_gene <- sapply(strsplit(as.character(sample_table$J_gene), "[*]") , "[", 1)
        if (!is.null(sample_table$D_gene)) {
          sample_table$D_gene <- sapply(strsplit(as.character(sample_table$D_gene), "[*]") , "[", 1)
        }
        if (!is.null(sample_table$C_gene)) {
          sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), "[*]") , "[", 1)
        }
      }
      
      # Current chain
      
      IGKL_table <- NULL
      
      for (current_chain in chains_search) {
        
        which_chain <-
          t(apply(sample_table[c("V_gene", "J_gene")], 1, function(u)
            grepl(current_chain, u)))               
        
        chain_table_unprocessed <- sample_table[as.logical(rowSums(which_chain)),]
        
        if (current_chain == "IGH" && input_format == "ADAPTIVE" && cdr3nt_skip == FALSE) {
          chain_table_unprocessed$CDR3_AA <- as.character(translate(DNAStringSet(chain_table_unprocessed$CDR3),if.fuzzy.codon="X"))
        }
        
        if (input_format != "RHTCRSEQ" && cdr3nt_skip == FALSE){
          chain_table_unprocessed_allframe <- chain_table_unprocessed
          chain_table_unprocessed <- chain_table_unprocessed[(data.frame(names = chain_table_unprocessed$CDR3,
                                                                         chr = apply(chain_table_unprocessed, 2, nchar))$chr.CDR3 %% 3 == 0), ]
        } else if (cdr3nt_skip == TRUE) {
          x <- as.character(chain_table_unprocessed$CDR3_AA) %in% null_values
          chain_table_unprocessed <- chain_table_unprocessed[!x,]
        }
        
        count_sum = sum(chain_table_unprocessed$read_fragment_count)
        chain_table_unprocessed$read_fragment_freq <- sapply(chain_table_unprocessed$read_fragment_count/count_sum , "[", 1)
        
        if (dim(chain_table_unprocessed)[1] != 0) {
          
          if (sample_level_run == TRUE) {
            
            dir.create(paste(output_dir,current_sample,current_chain,sep="/"), showWarnings = FALSE)
            
            # cdr3ntlength
            
            if (input_format != "RHTCRSEQ" && cdr3nt_skip == FALSE){
            
              chain_table <- chain_table_unprocessed_allframe
              
              if (nrow(chain_table)>1) {
                chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
              } else {
                chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
              }
              
              chain_table <- chain_table[c("read_fragment_count","cdr3length")]
              chain_table <- aggregate(.~cdr3length, chain_table, sum)
  
              write.table(
                t(chain_table),
                file = paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3ntLength.csv',sep=""),
                quote = F,
                sep = ",",
                row.names = F,
                col.names= F,
                na = ""
              )
              
              if (json_out == TRUE) {
                names(chain_table) <- c("Nucleotide Length","Count")
                json_base[["CDR3 Nucleotide Distribution"]] <- as.data.frame(t(chain_table),stringsAsFactors=TRUE)
                colnames(json_base[["CDR3 Nucleotide Distribution"]]) <- c(1:nrow(chain_table))
                
                for (i in c(1:nrow(chain_table))){
                  json_base[["CDR3 Nucleotide Distribution"]][[i]] <- as.list(json_base[["CDR3 Nucleotide Distribution"]][[i]])
                  json_base[["CDR3 Nucleotide Distribution"]][[i]] <- setNames(json_base[["CDR3 Nucleotide Distribution"]][[i]],as.list(c("Nucleotide Length","Count")))
                }
              }
              
              rm(chain_table_unprocessed_allframe)
              
            }
            
            # clonotype
            
            chain_table <- chain_table_unprocessed
            
            if (nrow(chain_table)>1) {
              chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3_AA']
            } else {
              chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3_AA']))
            }
            
            chain_table <- aggregate(read_fragment_freq~CDR3_AA+cdr3length, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            chain_table$CDR3_AA <- as.character(chain_table$CDR3_AA)
            x <- as.character(chain_table$CDR3_AA) %in% null_values
            chain_table <- rbind(chain_table[!x,], chain_table[x,])
            if (nrow(chain_table) > clonotypeMax){
              chain_table[c((clonotypeMax+1):length(chain_table$CDR3_AA)),'CDR3_AA'] <- "Other"
            }
            
            chain_table$CDR3_AA <- factor(chain_table$CDR3_AA,levels=unique(chain_table$CDR3_AA))
            names(chain_table)[names(chain_table) == 'CDR3_AA'] <- 'Clonotype'
            chain_table <- aggregate(read_fragment_freq ~ Clonotype + cdr3length, chain_table, sum)
            
            chain_table <- rbind(chain_table[(chain_table$'Clonotype'=='Other'),],chain_table[!(chain_table$'Clonotype'=='Other'),])
            chain_table[,3] <- formatC(chain_table[,3])
            
            write.table(
              chain_table,
              file = paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3aaLength.csv',sep=""),
              quote = F,
              sep = ",",
              row.names = F,
              col.names= F,
              na = ""
            )
            
            if (json_out == TRUE) {
              names(chain_table) <- c("Clonotype","Amino Acid Length","Frequency")
              json_base[["CDR3 Amino Acid Distribution"]] <- as.data.frame(t(chain_table),stringsAsFactors=FALSE)
              
              for (i in c(1:nrow(chain_table))){
                json_base[["CDR3 Amino Acid Distribution"]][[i]] <- as.list(json_base[["CDR3 Amino Acid Distribution"]][[i]])
                json_base[["CDR3 Amino Acid Distribution"]][[i]][[2]] <- as.numeric(json_base[["CDR3 Amino Acid Distribution"]][[i]][[2]])
                json_base[["CDR3 Amino Acid Distribution"]][[i]][[3]] <- as.numeric(json_base[["CDR3 Amino Acid Distribution"]][[i]][[3]])
                json_base[["CDR3 Amino Acid Distribution"]][[i]] <- setNames(json_base[["CDR3 Amino Acid Distribution"]][[i]],as.list(c("Clonotype","Amino Acid Length","Frequency")))
              }
            }
            
            # vsumbarplot
            
            chain_table <- chain_table_unprocessed
            
            chain_table <- aggregate(read_fragment_freq~V_gene, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            x <- as.character(chain_table$V_gene) %in% null_values
            chain_table <- chain_table[!x,]
            if (nrow(chain_table) > 0){
              sumV <- subset(unique(chain_table$V_gene)[c(1:sumMax)], (!is.na(unique(chain_table$V_gene)[c(1:sumMax)])))
              vjV <- subset(unique(chain_table$V_gene)[c(1:vjMax)], (!is.na(unique(chain_table$V_gene)[c(1:vjMax)])))
              chain_table <- chain_table[chain_table$V_gene %in% sumV, ]
              
              chain_table$V_gene <- factor(chain_table$V_gene)
              
              chain_table <- chain_table[naturalorder(chain_table$V_gene),]
              chain_table[,2] <- formatC(chain_table[,2])

              write.table(
                t(chain_table),
                file = paste(output_dir,'/',current_sample,'/',current_chain,'/vsumBarplot.csv',sep=""),
                quote = F,
                sep = ",",
                row.names = F,
                col.names= F,
                na = ""
              )
              
              if (json_out == TRUE) {
                names(chain_table) <- c("V-gene","Frequency")
                json_base[["V-gene usage"]] <- as.data.frame(t(chain_table),stringsAsFactors=FALSE)
                
                for (i in c(1:nrow(chain_table))){
                  json_base[["V-gene usage"]][[i]] <- as.list(json_base[["V-gene usage"]][[i]])
                  json_base[["V-gene usage"]][[i]][[2]] <- as.numeric(json_base[["V-gene usage"]][[i]][[2]])
                  json_base[["V-gene usage"]][[i]] <- setNames(json_base[["V-gene usage"]][[i]],as.list(c("V-gene","Frequency")))
                }
              }
              
            }
            
            # jsumbarplot
            
            chain_table <- chain_table_unprocessed
            
            chain_table <- aggregate(read_fragment_freq~J_gene, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            x <- as.character(chain_table$J_gene) %in% null_values
            chain_table <- chain_table[!x,]
            if (nrow(chain_table) > 0){
              sumJ <- subset(unique(chain_table$J_gene)[c(1:sumMax)], (!is.na(unique(chain_table$J_gene)[c(1:sumMax)])))
              vjJ <- subset(unique(chain_table$J_gene)[c(1:vjMax)], (!is.na(unique(chain_table$J_gene)[c(1:vjMax)])))
              chain_table <- chain_table[chain_table$J_gene %in% sumJ, ]
              
              chain_table$J_gene <- factor(chain_table$J_gene)
              chain_table <- chain_table[naturalorder(chain_table$J_gene),] 
              chain_table[,2] <- formatC(chain_table[,2])
              
              write.table(
                t(chain_table),
                file = paste(output_dir,'/',current_sample,'/',current_chain,'/jsumBarplot.csv',sep=""),
                quote = F,
                sep = ",",
                row.names = F,
                col.names= F,
                na = ""
              )
              
              if (json_out == TRUE) {
                names(chain_table) <- c("J-gene","Frequency")
                json_base[["J-gene usage"]] <- as.data.frame(t(chain_table),stringsAsFactors=FALSE)
                
                for (i in c(1:nrow(chain_table))){
                  json_base[["J-gene usage"]][[i]] <- as.list(json_base[["J-gene usage"]][[i]])
                  json_base[["J-gene usage"]][[i]][[2]] <- as.numeric(json_base[["J-gene usage"]][[i]][[2]])
                  json_base[["J-gene usage"]][[i]] <- setNames(json_base[["J-gene usage"]][[i]],as.list(c("J-gene","Frequency")))
                }
              }
              
            }
            
            if (current_chain == "IGH") {
              
              if (!is.null(chain_table_unprocessed$C_gene)) {
                
                # csumbarplot
                
                chain_table <- chain_table_unprocessed
                
                chain_table <- aggregate(read_fragment_freq~C_gene, chain_table, sum)
                
                chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
                
                x <- as.character(chain_table$C_gene) %in% null_values
                chain_table <- chain_table[!x,]
                if (nrow(chain_table) > 0){
                  sumC <- subset(unique(chain_table$C_gene)[c(1:sumMax)], (!is.na(unique(chain_table$C_gene)[c(1:sumMax)])))
                  chain_table <- chain_table[chain_table$C_gene %in% sumC, ]
                  
                  chain_table$C_gene <- factor(chain_table$C_gene)
                  chain_table <- chain_table[naturalorder(chain_table$C_gene),] 
                  chain_table[,2] <- formatC(chain_table[,2])
                  

                  write.table(
                    t(chain_table),
                    file = paste(output_dir,'/',current_sample,'/',current_chain,'/csumBarplot.csv',sep=""),
                    quote = F,
                    sep = ",",
                    row.names = F,
                    col.names= F,
                    na = ""
                  )
                }
              }
            }
            
            if (current_chain %in% c("IGH", "TRB", "TRD")) {
              
              if (!is.null(chain_table_unprocessed$D_gene)) {
                
                # dsumbarplot
                
                chain_table <- chain_table_unprocessed
                
                chain_table <- aggregate(read_fragment_freq~D_gene, chain_table, sum)
                
                chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
                
                x <- as.character(chain_table$D_gene) %in% null_values
                chain_table <- chain_table[!x,]
                if (nrow(chain_table) > 0){
                  sumD <- subset(unique(chain_table$D_gene)[c(1:sumMax)], (!is.na(unique(chain_table$D_gene)[c(1:sumMax)])))
                  chain_table <- chain_table[chain_table$D_gene %in% sumD, ]
                  
                  chain_table$D_gene <- factor(chain_table$D_gene)
                  chain_table <- chain_table[naturalorder(chain_table$D_gene),] 
                  chain_table[,2] <- formatC(chain_table[,2])

                  write.table(
                    t(chain_table),
                    file = paste(output_dir,'/',current_sample,'/',current_chain,'/dsumBarplot.csv',sep=""),
                    quote = F,
                    sep = ",",
                    row.names = F,
                    col.names= F,
                    na = ""
                  )
                  
                  if (json_out == TRUE) {
                    names(chain_table) <- c("D-gene","Frequency")
                    json_base[["D-gene usage"]] <- as.data.frame(t(chain_table),stringsAsFactors=FALSE)
                    
                    for (i in c(1:nrow(chain_table))){
                      json_base[["D-gene usage"]][[i]] <- as.list(json_base[["D-gene usage"]][[i]])
                      json_base[["D-gene usage"]][[i]][[2]] <- as.numeric(json_base[["D-gene usage"]][[i]][[2]])
                      json_base[["D-gene usage"]][[i]] <- setNames(json_base[["D-gene usage"]][[i]],as.list(c("D-gene","Frequency")))
                    }
                  }
                  
                }
              }
              
            }
            
            # vj
            
            chain_table <- chain_table_unprocessed
            
            x <- as.character(chain_table$J_gene) %in% null_values
            chain_table <- chain_table[!x,]
            
            x <- as.character(chain_table$V_gene) %in% null_values
            chain_table <- chain_table[!x,]
            
            if (nrow(chain_table) > 0){
              
              chain_table <- chain_table[chain_table$J_gene %in% vjJ, ]
              chain_table <- chain_table[chain_table$V_gene %in% vjV, ]
              
              chain_table <- chain_table[c("J_gene","V_gene","read_fragment_freq")]
              chain_table <- aggregate(read_fragment_freq ~ J_gene + V_gene, chain_table, sum)
              chain_table <- chain_table[naturalorder(chain_table$V_gene),] 
              chain_table[,3] <- formatC(chain_table[,3])

              write.table(
                chain_table,
                file = paste(output_dir,'/',current_sample,'/',current_chain,'/vjStackBar.csv',sep=""),
                quote = F,
                sep = ",",
                row.names = F,
                col.names= F,
                na = ""
              )
              
              if (json_out == TRUE) {
                names(chain_table) <- c("J-gene","V-gene","Frequency")
                json_base[["VJ-gene usage"]] <- as.data.frame(t(chain_table),stringsAsFactors=FALSE)
                
                for (i in c(1:nrow(chain_table))){
                  json_base[["VJ-gene usage"]][[i]] <- as.list(json_base[["VJ-gene usage"]][[i]])
                  json_base[["VJ-gene usage"]][[i]][[3]] <- as.numeric(json_base[["VJ-gene usage"]][[i]][[3]])
                  json_base[["VJ-gene usage"]][[i]] <- setNames(json_base[["VJ-gene usage"]][[i]],as.list(c("J-gene","V-gene","Frequency")))
                }
              }
              
            }
          }
          if (intracohort_run == TRUE) {
            
            # Isotype support
            
            chain_iso_list <- c(current_chain)
            
            if (chain_iso_list %in% c('IGK','IGL') && 'IGK' %in% chains_search && 'IGL' %in% chains_search) {
              if (is.null(IGKL_table)){
                IGKL_table <- chain_table_unprocessed
              } else {
                IGKL_table <- rbind(IGKL_table,chain_table_unprocessed)
                chain_iso_list <- append(chain_iso_list, 'IGK+IGL')
              }
            }
            
            if (current_chain == 'IGH' && !is.null(chain_table_unprocessed$C_gene)){
              for (isotype in isotype_list){
                if (isotype %in% unique(chain_table_unprocessed$C_gene)){
                  chain_iso_list <- append(chain_iso_list, isotype)
                }
              }
            }
            
            for (chain_iso in chain_iso_list) {
            
              # Clonality and diversity measures for intracohort analysis
              
              intracohort_values <- intracohort_values_template
              
              if (chain_iso %in% isotype_list) {
                chain_table_div <- chain_table_unprocessed[chain_table_unprocessed$C_gene == chain_iso,]
              } else {
                chain_table_div <- chain_table_unprocessed
              }
              
              if (chain_iso == 'IGK+IGL'){
                chain_table_div <- IGKL_table
              }
              
              chain_table_div <- dplyr::filter(chain_table_div, !grepl("\\_",CDR3_AA))
              
              intracohort_values[1, 1] <- current_sample
              intracohort_values[1, 2] <- chain_iso
              
              if (nrow(chain_table_div) > 0){
              
                if (input_format == "RHTCRSEQ" || cdr3nt_skip == TRUE){
                  chain_table_cdr3 <- chain_table_div[c("read_fragment_count", "CDR3_AA")]
                  names(chain_table_cdr3)[names(chain_table_cdr3) == 'CDR3_AA'] <- 'CDR3'
                } else {
                  chain_table_cdr3 <- chain_table_div[c("read_fragment_count", "CDR3")]
                }
                
                chain_table_cdr3 <- dplyr::filter(chain_table_cdr3, !grepl("\\_",CDR3))
                chain_table_cdr3 <- dplyr::filter(chain_table_cdr3, !grepl("\\?",CDR3))
                
                if (nrow(chain_table_cdr3) != 1){
                  chain_table_cdr3$CDR3 <-
                    data.frame(names = chain_table_cdr3$CDR3,
                               chr = apply(chain_table_cdr3, 2, nchar))$chr.CDR3
                } else {
                  chain_table_cdr3$CDR3 <- nchar(as.character(chain_table_cdr3$CDR3))
                }
                
                names(chain_table_div)[names(chain_table_div) == 'read_fragment_count'] <- 'Clones'
                names(chain_table_div)[names(chain_table_div) == 'read_fragment_freq'] <- 'Proportion'
                names(chain_table_div)[names(chain_table_div) == 'CDR3'] <- 'CDR3.nt'
                names(chain_table_div)[names(chain_table_div) == 'CDR3_AA'] <- 'CDR3.aa'
                names(chain_table_div)[names(chain_table_div) == 'V_gene'] <- 'J.name'
                names(chain_table_div)[names(chain_table_div) == 'J_gene'] <- 'V.name'
                
                if (length(unique(chain_table_cdr3$CDR3)) != 1) {
                  if (nrow(chain_table_cdr3) != 1){
                    chain_table_cdr3 <-
                      aggregate(
                        chain_table_cdr3$read_fragment_count,
                        by = list(Category = chain_table_cdr3$CDR3),
                        FUN = sum
                      )
                  }
                }
                
                total_count <- 0
                cdr3_aggregate <- 0
                
                if ((nrow(chain_table_cdr3) != 1) && (length(unique(chain_table_cdr3$CDR3)) != 1)){
                  for (i in 1:nrow(chain_table_cdr3)) {
                    total_count <- total_count + chain_table_cdr3[i, 2]
                    cdr3_aggregate <- cdr3_aggregate + (chain_table_cdr3[i, 1]*chain_table_cdr3[i, 2])
                  }
                } 
                
                suppressMessages(intracohort_values[1, 3] <- round(repDiversity(chain_table_div, "div", process_col),4))
                if (nrow(chain_table_cdr3) != 1){
                  
                  ent_range <- aggregate(. ~ CDR3.aa, data=chain_table_div[c('Clones','CDR3.aa')], FUN=sum)[['Clones']]
                    
                  suppressMessages(intracohort_values[1, 4] <- round(entropy(ent_range),4))
                  suppressMessages(intracohort_values[1, 5] <- round(1/entropy(ent_range),4))
                  suppressMessages(intracohort_values[1, 6] <- round(entropy(ent_range,.norm=TRUE),4))
                  suppressMessages(intracohort_values[1, 7] <- round(repDiversity(chain_table_div, "gini", process_col),4))
                  suppressMessages(intracohort_values[1, 8] <- round(repDiversity(chain_table_div, "gini.simp", process_col),4))
                  suppressMessages(intracohort_values[1, 9] <- round(repDiversity(chain_table_div, "inv.simp", process_col),4))
                  suppressMessages(intracohort_values[1, 10] <- round(repDiversity(chain_table_div, "chao1", process_col)[1],4))
                  intracohort_values[1, 11] <- round((length(unique(chain_table_div$CDR3.aa))/sum(chain_table_div$Clones))*1000,4)
                } 
                
                clonality_top <- repClonality(chain_table_div, "top")
                suppressMessages(intracohort_values[1, 12] <- round(clonality_top[1],4))
                suppressMessages(intracohort_values[1, 13] <- round(clonality_top[2],4))
                suppressMessages(intracohort_values[1, 14] <- round(clonality_top[3],4))
                suppressMessages(intracohort_values[1, 15] <- round(repClonality(chain_table_div, "clonal.prop",.perc=10)[1],4))
                suppressMessages(intracohort_values[1, 16] <- round(repClonality(chain_table_div, "clonal.prop",.perc=50)[1],4))
                
                if (nrow(chain_table_cdr3) != 1){
                  suppressMessages(intracohort_values[1, 17] <- round(1-(entropy(ent_range)/log2(length(ent_range))),4))
                }
                
                if ((nrow(chain_table_cdr3) != 1) && (length(unique(chain_table_cdr3$CDR3)) != 1)){
                  intracohort_values[1, 18] <- round(cdr3_aggregate/total_count,4)
                } else {
                  intracohort_values[1, 18] <- chain_table_cdr3[1, 2]
                }
                
                if (input_format == "RHTCRSEQ" || cdr3nt_skip == TRUE){
                  intracohort_values[1, 18] <- intracohort_values[1, 19]*3
                }
                
                if (input_format == "RHTCRSEQ" || cdr3nt_skip == TRUE){
                  intracohort_values[1, 19] <- length(unique(chain_table_div$CDR3.aa))
                } else {
                  intracohort_values[1, 19] <- length(unique(chain_table_div$CDR3.nt))
                  intracohort_values[1, 20] <- length(unique(chain_table_div$CDR3.aa))
                }
                
                if (length(clonotypeAbundance)>0){
                  for (i in c(1:length(clonotypeAbundance))){
                    foundClonotype = sum(chain_table_div[which(chain_table_div$CDR3_AA == clonotypeAbundance[i]), ]$read_fragment_freq)
                    if (foundClonotype != 0){
                      foundClonotype = foundClonotype * 1000
                    }
                    #if (foundClonotype > 0){
                    intracohort_values[1, functionNum+i] <- foundClonotype
                    #}
                  }
                }
              }
              
              if (exists("intracohort_table")) {
                intracohort_table <- rbind(intracohort_table, intracohort_values)
              } else {
                intracohort_table <- intracohort_values
              }
              
              
              if (chain_iso == current_chain){
                if (json_out == TRUE) {
                  json_base[["Diversity and Clonality"]] <- intracohort_values[-c(1,2)]
                  dir.create(paste(output_dir,"/json",sep=""), showWarnings = FALSE)
                  write(toJSON(json_base), paste(output_dir,'/json/',current_sample,'_',current_chain,'.json',sep=""))
                }
              }
              
            }
          }
            # annotation
            if (current_chain == 'TRB' && db_run == TRUE){
              #common <- inner_join(db_table[c('CDR3_AA','V_gene','J_gene')],chain_table_unprocessed[c('CDR3_AA','V_gene','J_gene')])
              # v and j gene version
              #common <- merge(db_table, chain_table_unprocessed[c('CDR3_AA','V_gene','J_gene','read_fragment_freq')], by=c('CDR3_AA','V_gene','J_gene')) 
              # cdr3 AA only version
              common <- merge(db_table, chain_table_unprocessed[c('CDR3_AA','read_fragment_freq')], by=c('CDR3_AA')) 
              db_result[nrow(db_result)+1,] <- vector(mode="numeric",length=length(ncol(db_result)))
              if (nrow(common)>0){
                #antigen_table <- table(common$species_pathology)
                weighted_table <- as.data.frame(count(x = common, species_pathology, wt = read_fragment_freq),stringsAsFactors = FALSE)
                #db_result[nrow(db_result)+1,] <- vector(mode="character",length=length(ncol(db_result)))
                for (i in c(1:ncol(db_result))){
                  col_name <- colnames(db_result)[i]
                  if (col_name %in% weighted_table$species_pathology){
                    db_result[nrow(db_result),i] <- weighted_table[which(weighted_table$species_pathology == col_name),2]
                  } else {
                    db_result[nrow(db_result),i] <- 0
                  }
                }
              }
              sample_list_db <- c(sample_list_db,current_sample)
            }
          }
        }
      }
    }
  }

# Write intracohort_data.csv

if (intracohort_run == TRUE) {
  write.table(
    intracohort_table,
    file = paste(output_dir,'/intracohort_data.csv',sep=""),
    quote = F,
    sep = ",",
    row.names = F,
    na = ""
  )
}

# Write db_data.csv
  
if (db_run == TRUE && nrow(db_result) > 0) {

  db_result <- db_result[,names(sort(colSums(db_result), decreasing = TRUE))]
  
  noncancer_results <- db_result[ , !names(db_result) %in% cancer_list ]
  noncancer_results <- noncancer_results[,names(sort(colSums(noncancer_results), decreasing = TRUE))]
  
  cancer_results <- db_result[,cancer_list]
  cancer_results <- cancer_results[,names(sort(colSums(cancer_results), decreasing = TRUE))]
  
  cancer_sum <- rowSums(db_result[,cancer_list])
  
  misc_sum <- rowSums(cbind
                      (noncancer_results[c(9:ncol(noncancer_results))],
                      cancer_results[c(4:ncol(cancer_results))]))
  
  db_result_cleaned <- cbind(noncancer_results[c(1:8)],cancer_results[c(1:3)],cancer_sum,misc_sum)
  db_result_cleaned[] <- lapply(db_result_cleaned, formatC)
  db_result_cleaned <- cbind(sample_list_db,'TRB',db_result_cleaned)
  db_result_cleaned <- db_result_cleaned[, colSums(db_result_cleaned != 0) > 0]
  
  colnames(db_result_cleaned) <- gsub("\\.", "", colnames(db_result_cleaned))
  
  colnames(db_result_cleaned)[c(1,2)] <- c("sample","chain")
  
  write.table(
    db_result_cleaned,
    file = paste(output_dir,'/db_data.csv',sep=""),
    quote = F,
    sep = ",",
    row.names = F,
    na = ""
  )
}


# Write sample_list.csv

if (sample_level_run == TRUE) {
  
  sample_list <- sample_list[naturalorder(sample_list)]
  
  write.table(
    sample_list,
    file = paste(output_dir,'/sample_list.csv',sep=""),
    quote = F,
    sep = ",",
    row.names = F,
    col.names = F
  )
}

if (cohort_level_run == TRUE) {
  
  print(paste(Sys.time(),"Generating cohort-level figures. This may take a while for a larger set."))
  
  sample_table = NULL
  
  # TRUST4 file format
  
  if (input_format == "TRUST4") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = F)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    if (ncol(sample_table) == 10) {
      colnames(sample_table) <-
        c(
          "consensus_id",
          "index_within_consensus",
          "V_gene",
          "J_gene",
          "C_gene",
          "CDR1",
          "CDR2",
          "CDR3",
          "CDR3_score",
          "read_fragment_count"
        )
    } else if (ncol(sample_table) == 11) {
      colnames(sample_table) <-
        c(
          "consensus_id",
          "index_within_consensus",
          "V_gene",
          "D_gene",
          "J_gene",
          "C_gene",
          "CDR1",
          "CDR2",
          "CDR3",
          "CDR3_score",
          "read_fragment_count"
        )
    } else if (ncol(sample_table) == 12) {
      colnames(sample_table) <-
        c(
          "consensus_id",
          "index_within_consensus",
          "V_gene",
          "D_gene",
          "J_gene",
          "C_gene",
          "CDR1",
          "CDR2",
          "CDR3",
          "CDR3_score",
          "read_fragment_count",
          "CDR3_germline_similarity"
        )
    }
    
    # remove partials
    sample_table <- sample_table[(sample_table$CDR3_score != 0.00), ]
    
    sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))

    sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), ",") , "[", 1)
    
  } 
  
  # TRUST4_SIMPLE file format
  
  else if (input_format == "TRUST4_SIMPLE") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[which(names(sample_table) == "V")] <- "V_gene"
    colnames(sample_table)[which(names(sample_table) == "D")] <- "D_gene"
    colnames(sample_table)[which(names(sample_table) == "J")] <- "J_gene"
    colnames(sample_table)[which(names(sample_table) == "C")] <- "C_gene"
    colnames(sample_table)[which(names(sample_table) == "CDR3nt")] <- "CDR3"
    colnames(sample_table)[which(names(sample_table) == "CDR3aa")] <- "CDR3_AA"
    colnames(sample_table)[which(names(sample_table) == "X.count")] <- "read_fragment_count"
    
    # remove partials
    sample_table <- sample_table[(sample_table$CDR3_AA != "partial"), ]
    
  } 
  
  # VDJTOOLS file format
  
  else if (input_format == "VDJTOOLS") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[which(names(sample_table) == "v")] <- "V_gene"
    colnames(sample_table)[which(names(sample_table) == "d")] <- "D_gene"
    colnames(sample_table)[which(names(sample_table) == "j")] <- "J_gene"
    colnames(sample_table)[which(names(sample_table) == "c")] <- "C_gene"
    colnames(sample_table)[which(names(sample_table) == "cdr3nt")] <- "CDR3"
    colnames(sample_table)[which(names(sample_table) == "cdr3aa")] <- "CDR3_AA"
    colnames(sample_table)[which(names(sample_table) == "count")] <- "read_fragment_count"
    
  } 
  
  # MIXCR file format
  
  else if (input_format == "MIXCR") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[which(names(sample_table) == "allVHitsWithScore")] <- "V_gene"
    colnames(sample_table)[which(names(sample_table) == "allDHitsWithScore")] <- "D_gene"
    colnames(sample_table)[which(names(sample_table) == "allJHitsWithScore")] <- "J_gene"
    colnames(sample_table)[which(names(sample_table) == "allCHitsWithScore")] <- "C_gene"
    colnames(sample_table)[which(names(sample_table) == "nSeqCDR3")] <- "CDR3"
    colnames(sample_table)[which(names(sample_table) == "aaSeqCDR3")] <- "CDR3_AA"
    colnames(sample_table)[which(names(sample_table) == "cloneCount")] <- "read_fragment_count"
    
  } 
  
  # ADAPTIVE file format
  
  else if (input_format == "ADAPTIVE") {
    
    sample_table_test <- read.delim(paste(input_dir,"/",input_prefix,files[1],input_suffix, sep = ""), header = T)
    
    if ("v_gene" %in% colnames(sample_table_test)) {
      
      adaptive_counts = "templates"
      
      if (all(is.na(sample_table_test$template))) {adaptive_counts <- "seq_reads"}
      
      rm(sample_table_test)
      all_dfs <- lapply(files, function(x){
        sample_table_pt <- read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T)[c("v_gene","d_gene","j_gene","rearrangement","amino_acid",adaptive_counts,"v_index","cdr3_length")]
        
        colnames(sample_table_pt)[which(names(sample_table_pt) == "v_gene")] <- "V_gene"
        colnames(sample_table_pt)[which(names(sample_table_pt) == "d_gene")] <- "D_gene"
        colnames(sample_table_pt)[which(names(sample_table_pt) == "j_gene")] <- "J_gene"
        colnames(sample_table_pt)[which(names(sample_table_pt) == "rearrangement")] <- "CDR3"
        colnames(sample_table_pt)[which(names(sample_table_pt) == "amino_acid")] <- "CDR3_AA"
        colnames(sample_table_pt)[which(names(sample_table_pt) == adaptive_counts)] <- "read_fragment_count"
        
        if (cdr3nt_skip == TRUE){
          
          sample_table_pt <- sample_table_pt[ , !(names(sample_table_pt) %in% c("v_index","cdr3_length","CDR3"))]
          
        } else {
          
          sample_table_pt[,"CDR3"] <- as.character(sample_table_pt[,"CDR3"])
          
          for(i in 1:nrow(sample_table_pt)) {
            row <- sample_table_pt[i,]
            cdr3_nt <- substr(row$CDR3,row$v_index+1,row$v_index+row$cdr3_length)
            sample_table_pt[i,"CDR3"] <- cdr3_nt
            
          }
          
          sample_table_pt <- sample_table_pt[ , !(names(sample_table_pt) %in% c("v_index","cdr3_length"))]
        
        }
        
        sample_table_pt$V_gene <- gsub('TCR', 'TR', sample_table_pt$V_gene)      
        sample_table_pt$D_gene <- gsub('TCR', 'TR', sample_table_pt$D_gene)    
        sample_table_pt$J_gene <- gsub('TCR', 'TR', sample_table_pt$J_gene)    
        
        sample_table_pt
        
      })
      
      } else if ("vGeneName" %in% colnames(sample_table_test)) {
        
        if ("count..templates.reads." %in% colnames(sample_table_test)) {
          count_name <- "count..templates.reads."
        } else if ("count..templates." %in% colnames(sample_table_test)) {
          count_name <- "count..templates."
        }
        
        rm(sample_table_test)
        all_dfs <- lapply(files, function(x){
          sample_table_pt <- read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T)[c("vGeneName","dGeneName","jGeneName","nucleotide","aminoAcid",count_name,"vIndex","cdr3Length")]
          
          colnames(sample_table_pt)[which(names(sample_table_pt) == "vGeneName")] <- "V_gene"
          colnames(sample_table_pt)[which(names(sample_table_pt) == "dGeneName")] <- "D_gene"
          colnames(sample_table_pt)[which(names(sample_table_pt) == "jGeneName")] <- "J_gene"
          colnames(sample_table_pt)[which(names(sample_table_pt) == "nucleotide")] <- "CDR3"
          colnames(sample_table_pt)[which(names(sample_table_pt) == "aminoAcid")] <- "CDR3_AA"
          
          colnames(sample_table_pt)[which(names(sample_table_pt) == count_name)] <- "read_fragment_count"
          
          colnames(sample_table_pt)[which(names(sample_table_pt) == "vIndex")] <- "v_index"
          colnames(sample_table_pt)[which(names(sample_table_pt) == "cdr3Length")] <- "cdr3_length"
          
          if (cdr3nt_skip == TRUE){
            
            sample_table <- sample_table[ , !(names(sample_table) %in% c("v_index","cdr3_length","CDR3"))]
            
          } else {
            
            sample_table_pt[,"CDR3"] <- as.character(sample_table_pt[,"CDR3"])
            
            for(i in 1:nrow(sample_table_pt)) {
              row <- sample_table_pt[i,]
              cdr3_nt <- substr(row$CDR3,row$v_index+1,row$v_index+row$cdr3_length)
              sample_table_pt[i,"CDR3"] <- cdr3_nt
              
            }
            
            sample_table_pt <- sample_table_pt[ , !(names(sample_table_pt) %in% c("v_index","cdr3_length"))]
          
          }
          
          sample_table_pt$V_gene <- gsub('TCR', 'TR', sample_table_pt$V_gene)      
          sample_table_pt$D_gene <- gsub('TCR', 'TR', sample_table_pt$D_gene)    
          sample_table_pt$J_gene <- gsub('TCR', 'TR', sample_table_pt$J_gene) 
          
          sample_table_pt
          
        })
        
      }
    
    sample_table <- do.call(rbind,all_dfs)
    
  } 
  
  # RHTCRSEQ file format
  
  else if (input_format == "RHTCRSEQ") { 
    
    all_dfs <- lapply(files, function(x){
    
      sample_table_pt_trb <- read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = T, sep = ',')[c('v_hit','j_hit','cdr3','count_sum')] 
      input_suffix_tra <- gsub("TRB","TRA",input_suffix)
      sample_table_pt_tra <- read.delim(paste(input_dir,"/",input_prefix,x,input_suffix_tra, sep = ""), header = T, sep = ',')[c('v_hit','j_hit','cdr3','count_sum')]
      
      sample_table_pt <- rbind(sample_table_pt_trb,sample_table_pt_tra)
      
      colnames(sample_table_pt)[which(names(sample_table_pt) == "v_hit")] <- "V_gene"
      colnames(sample_table_pt)[which(names(sample_table_pt) == "j_hit")] <- "J_gene"
      colnames(sample_table_pt)[which(names(sample_table_pt) == "cdr3")] <- "CDR3_AA"
      colnames(sample_table_pt)[which(names(sample_table_pt) == "count_sum")] <- "read_fragment_count"
      
      sample_table_pt
      
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
  } 
  
  # CUSTOM file format
  
  else if (input_format == "CUSTOM") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",input_prefix,x,input_suffix, sep = ""), header = custom_header, sep = custom_sep)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[custom_cdr3] <- "CDR3"
    colnames(sample_table)[custom_v] <- "V_gene"
    colnames(sample_table)[custom_j] <- "J_gene" 
    if (!is.null(custom_c)){
      colnames(sample_table)[custom_c] <- "C_gene"
    }
    if (!is.null(custom_d)){
      colnames(sample_table)[custom_d] <- "D_gene" 
    }
    colnames(sample_table)[custom_count] <- "read_fragment_count"
    
    sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))
    
  }
  
  current_sample = "All"
  
  dir.create(paste(output_dir,current_sample,sep="/"), showWarnings = FALSE)
  
  # Clean V,D,J,C-genes
  
  if (input_format %in% c("MIXCR","TRUST4","TRUST4_SIMPLE","VDJTOOLS")){
    sample_table$V_gene <- sapply(strsplit(as.character(sample_table$V_gene), "[*]") , "[", 1)
    sample_table$J_gene <- sapply(strsplit(as.character(sample_table$J_gene), "[*]") , "[", 1)
    if (!is.null(sample_table$D_gene)) {
      sample_table$D_gene <- sapply(strsplit(as.character(sample_table$D_gene), "[*]") , "[", 1)
    }
    if (!is.null(sample_table$C_gene)) {
      sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), "[*]") , "[", 1)
    }
  }
  
  sample_table <- sample_table[order(-sample_table$read_fragment_count),] 
  
  # Current chain
  
  for (current_chain in chains_search) {
    
    which_chain <-
      t(apply(sample_table[c("V_gene", "J_gene")], 1, function(u)
        grepl(current_chain, u)))  

    chain_table_unprocessed <- sample_table[as.logical(rowSums(which_chain)),]
    
    if (current_chain == "IGH" && input_format == "ADAPTIVE" && cdr3nt_skip == FALSE) {
      chain_table_unprocessed$CDR3_AA <- as.character(translate(DNAStringSet(chain_table_unprocessed$CDR3),if.fuzzy.codon="X"))
    }
    
    # in-frame only
    
    if (input_format != "RHTCRSEQ" && cdr3nt_skip == FALSE) {
      chain_table_unprocessed_allframe <- chain_table_unprocessed
      chain_table_unprocessed <- chain_table_unprocessed[(data.frame(names = chain_table_unprocessed$CDR3,
                                                                     chr = apply(chain_table_unprocessed, 2, nchar))$chr.CDR3 %% 3 == 0), ]
    } else if (cdr3nt_skip == TRUE) {
      x <- as.character(chain_table_unprocessed$CDR3_AA) %in% null_values
      chain_table_unprocessed <- chain_table_unprocessed[!x,]
    }
    
    if (dim(chain_table_unprocessed)[1] != 0) {
      
      dir.create(paste(output_dir,current_sample,current_chain,sep="/"), showWarnings = FALSE)
      
      count_sum = sum(chain_table_unprocessed$read_fragment_count)
      chain_table_unprocessed$read_fragment_freq <- sapply(chain_table_unprocessed$read_fragment_count/count_sum , "[", 1)
      
      # cdr3ntlength
      
      if (input_format != "RHTCRSEQ" && cdr3nt_skip == FALSE) {
      
      chain_table <- chain_table_unprocessed_allframe
      
        if (nrow(chain_table)>1) {
          chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
        } else {
          chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
        }
        
        chain_table <- chain_table[c("read_fragment_count","cdr3length")]
        chain_table <- aggregate(.~cdr3length, chain_table, sum)
  
        write.table(
          t(chain_table),
          file = paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3ntLength.csv',sep=""),
          quote = F,
          sep = ",",
          row.names = F,
          col.names= F,
          na = ""
        )
        
        rm(chain_table_unprocessed_allframe)
        
      }
      
      # clonotype
      
      chain_table <- chain_table_unprocessed
      
      if (nrow(chain_table)>1) {
        chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3_AA']
      } else {
        chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3_AA']))
      }
      
      chain_table <- aggregate(read_fragment_freq~CDR3_AA+cdr3length, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      chain_table$CDR3_AA <- as.character(chain_table$CDR3_AA)
      x <- as.character(chain_table$CDR3_AA) %in% null_values
      chain_table <- rbind(chain_table[!x,], chain_table[x,])
      if (nrow(chain_table) > clonotypeMax){
        chain_table[c((clonotypeMax+1):length(chain_table$CDR3_AA)),'CDR3_AA'] <- "Other"
      }
      
      chain_table$CDR3_AA <- factor(chain_table$CDR3_AA,levels=unique(chain_table$CDR3_AA))
      names(chain_table)[names(chain_table) == 'CDR3_AA'] <- 'Clonotype'
      chain_table <- aggregate(read_fragment_freq ~ Clonotype + cdr3length, chain_table, sum)
      
      chain_table <- rbind(chain_table[(chain_table$'Clonotype'=='Other'),],chain_table[!(chain_table$'Clonotype'=='Other'),])

      write.table(
        chain_table,
        file = paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3aaLength.csv',sep=""),
        quote = F,
        sep = ",",
        row.names = F,
        col.names= F,
        na = ""
      )
      
      # vsumbarplot
      
      chain_table <- chain_table_unprocessed
      
      chain_table <- aggregate(read_fragment_freq~V_gene, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      x <- as.character(chain_table$V_gene) %in% null_values
      chain_table <- chain_table[!x,]
      if (nrow(chain_table) > 0){
        
        sumV <- subset(unique(chain_table$V_gene)[c(1:sumMax)], (!is.na(unique(chain_table$V_gene)[c(1:sumMax)])))
        vjV <- subset(unique(chain_table$V_gene)[c(1:vjMax)], (!is.na(unique(chain_table$V_gene)[c(1:vjMax)])))
        chain_table <- chain_table[chain_table$V_gene %in% sumV, ]
        
        chain_table$V_gene <- factor(chain_table$V_gene)
        chain_table <- chain_table[naturalorder(chain_table$V_gene),] 

        write.table(
          t(chain_table),
          file = paste(output_dir,'/',current_sample,'/',current_chain,'/vsumBarplot.csv',sep=""),
          quote = F,
          sep = ",",
          row.names = F,
          col.names= F,
          na = ""
        )
      }
      
      # jsumbarplot
      
      chain_table <- chain_table_unprocessed
      
      chain_table <- aggregate(read_fragment_freq~J_gene, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      x <- as.character(chain_table$J_gene) %in% null_values
      chain_table <- chain_table[!x,]
      if (nrow(chain_table) > 0){
        sumJ <- subset(unique(chain_table$J_gene)[c(1:sumMax)], (!is.na(unique(chain_table$J_gene)[c(1:sumMax)])))
        vjJ <- subset(unique(chain_table$J_gene)[c(1:vjMax)], (!is.na(unique(chain_table$J_gene)[c(1:vjMax)])))
        chain_table <- chain_table[chain_table$J_gene %in% sumJ, ]
        
        chain_table$J_gene <- factor(chain_table$J_gene)
        chain_table <- chain_table[naturalorder(chain_table$J_gene),] 

        write.table(
          t(chain_table),
          file = paste(output_dir,'/',current_sample,'/',current_chain,'/jsumBarplot.csv',sep=""),
          quote = F,
          sep = ",",
          row.names = F,
          col.names= F,
          na = ""
        )
      }
      
      if (current_chain == "IGH") {
        
        if (!is.null(chain_table_unprocessed$C_gene)) {
          
          # csumbarplot
          
          chain_table <- chain_table_unprocessed
          
          chain_table <- aggregate(read_fragment_freq~C_gene, chain_table, sum)
          
          chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
          
          x <- as.character(chain_table$C_gene) %in% null_values
          chain_table <- chain_table[!x,]
          if (nrow(chain_table) > 0){
            sumC <- subset(unique(chain_table$C_gene)[c(1:sumMax)], (!is.na(unique(chain_table$C_gene)[c(1:sumMax)])))
            chain_table <- chain_table[chain_table$C_gene %in% sumC, ]
            
            chain_table$C_gene <- factor(chain_table$C_gene)
            chain_table <- chain_table[naturalorder(chain_table$C_gene),] 

            write.table(
              t(chain_table),
              file = paste(output_dir,'/',current_sample,'/',current_chain,'/csumBarplot.csv',sep=""),
              quote = F,
              sep = ",",
              row.names = F,
              col.names= F,
              na = ""
            )
          }
          
        }
      }
      
      if (current_chain %in% c("IGH", "TRB", "TRD")) {
        
        # dsumbarplot
        
        if (!is.null(chain_table_unprocessed$D_gene)) {
          
          chain_table <- chain_table_unprocessed
          
          chain_table <- aggregate(read_fragment_freq~D_gene, chain_table, sum)
          
          chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
          
          x <- as.character(chain_table$D_gene) %in% null_values
          chain_table <- chain_table[!x,]
          if (nrow(chain_table) > 0){
            sumD <- subset(unique(chain_table$D_gene)[c(1:sumMax)], (!is.na(unique(chain_table$D_gene)[c(1:sumMax)])))
            chain_table <- chain_table[chain_table$D_gene %in% sumD, ]
            
            chain_table$D_gene <- factor(chain_table$D_gene)
            chain_table <- chain_table[naturalorder(chain_table$D_gene),] 

            write.table(
              t(chain_table),
              file = paste(output_dir,'/',current_sample,'/',current_chain,'/dsumBarplot.csv',sep=""),
              quote = F,
              sep = ",",
              row.names = F,
              col.names= F,
              na = ""
            )
          }
          
        }
        
      }
      
      # vj
      
      chain_table <- chain_table_unprocessed
      
      x <- as.character(chain_table$J_gene) %in% null_values
      chain_table <- chain_table[!x,]
      
      x <- as.character(chain_table$V_gene) %in% null_values
      chain_table <- chain_table[!x,]
      
      if (nrow(chain_table) > 0){
        
        chain_table <- chain_table[chain_table$J_gene %in% vjJ, ]
        chain_table <- chain_table[chain_table$V_gene %in% vjV, ]
        
        chain_table <- chain_table[c("J_gene","V_gene","read_fragment_freq")]
        chain_table <- aggregate(read_fragment_freq ~ J_gene + V_gene, chain_table, sum)
        chain_table <- chain_table[naturalorder(chain_table$V_gene),] 

        write.table(
          chain_table,
          file = paste(output_dir,'/',current_sample,'/',current_chain,'/vjStackBar.csv',sep=""),
          quote = F,
          sep = ",",
          row.names = F,
          col.names= F,
          na = ""
        )
        
      }
    }
  }
}

# Write cohort_list.csv

if (!is.null(report_dir)) {
  
  if (file.exists(paste(report_dir,"/cohort_list.csv",sep=""))) {
    cohort_list <- read.table(paste(report_dir,"/cohort_list.csv",sep=""),stringsAsFactors=FALSE, header=FALSE,sep=",")
    
    if (any(cohort_list$V1==output_dir) != TRUE) {
      cohort_list = rbind(c(output_dir,output_name),cohort_list)
      write.table(cohort_list,paste(report_dir,"/cohort_list.csv",sep=""),row.names=FALSE,col.names=FALSE,quote=FALSE,sep=",")
    }
    
  } else {
    write.table(rbind(c(output_dir,output_name)),paste(report_dir,"/cohort_list.csv",sep=""),row.names=FALSE,col.names=FALSE,quote=FALSE,sep=",")
  }
}

print(paste(Sys.time(),"Finished"))

