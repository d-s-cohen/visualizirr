#!/usr/bin/env Rscript
args = commandArgs(trailingOnly=TRUE)

# WIP script for generating overlap figures

if (length(args)==0) {
  if(file.exists("config.R")){
    source("config.R")
  } else {
    stop("'Usage: Rscript immuneRepOverlap.R config.R'", call.=FALSE)
  }
} else if (length(args)==1) {
  source(args[1])
} else {
  stop("'Usage: Rscript immuneRepOverlap.R config.R'", call.=FALSE)
}

read_cloneset <- function(current_sample){

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
    
    colnames(sample_table) <-
      c(
        "read_fragment_count",
        "read_fragment_freq",
        "CDR3",
        "CDR3_AA",
        "V_gene",
        "D_gene",            
        "J_gene",
        "C_gene",
        "junction"
      )
    
    # remove partials
    sample_table <- sample_table[(sample_table$CDR3_AA != "partial"), ]
    
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
      
      sample_table <- sample_table[c("v_gene","d_gene","j_gene","rearrangement","amino_acid","templates","v_index","cdr3_length")]
      
      colnames(sample_table)[which(names(sample_table) == "v_gene")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "d_gene")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "j_gene")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "rearrangement")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "amino_acid")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "templates")] <- "read_fragment_count"
      
    } else if ("vGeneName" %in% colnames(sample_table)) {
      
      sample_table <- sample_table[c("vGeneName","dGeneName","jGeneName","nucleotide","aminoAcid","count..templates.reads.","vIndex","cdr3Length")]
      
      colnames(sample_table)[which(names(sample_table) == "vGeneName")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "dGeneName")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "jGeneName")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "nucleotide")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "aminoAcid")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "count..templates.reads.")] <- "read_fragment_count"
      
      colnames(sample_table)[which(names(sample_table) == "vIndex")] <- "v_index"
      colnames(sample_table)[which(names(sample_table) == "cdr3Length")] <- "cdr3_length"
      
    }
    
    sample_table[,"CDR3"] <- as.character(sample_table[,"CDR3"])
    
    for(i in 1:nrow(sample_table)) {
      row <- sample_table[i,]
      cdr3_nt <- substr(row$CDR3,row$v_index+1,row$v_index+row$cdr3_length)
      sample_table[i,"CDR3"] <- cdr3_nt
      
    }
    
    sample_table <- sample_table[ , !(names(sample_table) %in% c("v_index","cdr3_length"))]
    
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
  
  
  if (input_format %in% c("MIXCR","TRUST4","TRUST4_SIMPLE")){
    sample_table$V_gene <- sapply(strsplit(as.character(sample_table$V_gene), "[*]") , "[", 1)
    sample_table$J_gene <- sapply(strsplit(as.character(sample_table$J_gene), "[*]") , "[", 1)
    if (!is.null(sample_table$D_gene)) {
      sample_table$D_gene <- sapply(strsplit(as.character(sample_table$D_gene), "[*]") , "[", 1)
    }
    if (!is.null(sample_table$C_gene)) {
      sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), "[*]") , "[", 1)
    }
  }
  
  names(sample_table)[names(sample_table) == 'read_fragment_count'] <- 'Clones'
  names(sample_table)[names(sample_table) == 'CDR3'] <- 'CDR3.nt'
  names(sample_table)[names(sample_table) == 'CDR3_AA'] <- 'CDR3.aa'
  names(sample_table)[names(sample_table) == 'V_gene'] <- 'J.name'
  names(sample_table)[names(sample_table) == 'J_gene'] <- 'V.name'

  return(sample_table)  
  
}

overlap_column <- 'Treatment'

meta_data <- read.delim(paste(output_dir,"/meta.csv", sep = ""), header = T, sep=",", stringsAsFactors=FALSE, check.names = FALSE)

overlap_column <- names(meta_data[ grepl( paste('^',overlap_column,'\\|',sep='') , names( meta_data ) ) ])

meta_data <- meta_data[complete.cases(meta_data[,overlap_column]), ]

overlap_points <- sort(unique(meta_data[,overlap_column]))

if (input_format == "RHTCRSEQ"){
  out_data <- data.frame(matrix(ncol=4))
  colnames(out_data) <- c("samples","chain","Jaccard Index (AA)", "Morisita Index (AA)")
} else {
  out_data <- data.frame(matrix(ncol=6))
  colnames(out_data) <- c("samples","chain","Jaccard Index (Nt)","Jaccard Index (AA)", "Morisita Index (Nt)","Morisita Index (AA)")  
}

if (length(overlap_points) < 2) {
  print("Overlap Condition must have 2+ groups")
  stop()
}

meta_data_o <- meta_data
meta_data_o[overlap_column] <- NULL
meta_data_o$VisGroup <- NULL

overlap_header <- strsplit(overlap_column,'\\|')[[1]]

overlap_header_out <- overlap_header[1]

for (i in c(2:length(overlap_header))) {
  
  if (is.na(overlap_header[i+1])) {break}
  
  overlap_header_out <- paste(overlap_header_out,paste(overlap_header[i],overlap_header[i+1],sep='/'),sep='|')
  
}

out_meta <- meta_data_o[1,]
out_meta[,overlap_header_out] <- NA
out_meta <- out_meta[0,]

for (currentVisGroup in unique(meta_data$VisGroup)) {
  
  visGroupSamples <- meta_data[meta_data$VisGroup == currentVisGroup,]
  
  currentOverlapGroups <- sort(unique(visGroupSamples[,overlap_column]))
  
  for (i in c(1:length(currentOverlapGroups))) {
    
    if (is.na(currentOverlapGroups[i+1])) {break}
    
    cloneset_name_1 <- visGroupSamples[visGroupSamples[,overlap_column] == currentOverlapGroups[i],]$sample[1]
    cloneset_name_2 <- visGroupSamples[visGroupSamples[,overlap_column] == currentOverlapGroups[i+1],]$sample[1]
    
    cloneset_1_allchain <- read_cloneset(cloneset_name_1)
    cloneset_2_allchain <- read_cloneset(cloneset_name_2)
    
    for (current_chain in chains_search) {
      
      which_chain <-
        t(apply(cloneset_1_allchain[c("V.name", "J.name")], 1, function(u)
          grepl(current_chain, u)))               
      
      cloneset_1 <- cloneset_1_allchain[as.logical(rowSums(which_chain)),]
      
      if (input_format != "RHTCRSEQ"){
        cloneset_1_aa <- cloneset_1[(data.frame(names = cloneset_1$CDR3.nt,
                                                                       chr = apply(cloneset_1, 2, nchar))$chr.CDR3.nt %% 3 == 0), ]
      }

      which_chain <-
        t(apply(cloneset_2_allchain[c("V.name", "J.name")], 1, function(u)
          grepl(current_chain, u)))               
            
      cloneset_2 <- cloneset_2_allchain[as.logical(rowSums(which_chain)),]
      
      if (input_format != "RHTCRSEQ"){
        cloneset_2_aa <- cloneset_2[(data.frame(names = cloneset_2$CDR3.nt,
                                                chr = apply(cloneset_2, 2, nchar))$chr.CDR3.nt %% 3 == 0), ]
      }

      clonesets_nt <- list(cloneset_1,cloneset_2)
      clonesets_aa <- list(cloneset_1_aa,cloneset_2_aa)
      
      overlap_row <- c(paste(currentVisGroup,currentOverlapGroups[i],currentOverlapGroups[i+1],sep='_'),
                        current_chain,
                        repOverlap(clonesets_nt,.method="jaccard",.col="nt"),
                        repOverlap(clonesets_aa,.method="jaccard",.col="aa"),
                        repOverlap(clonesets_nt,.method="morisita",.col="nt"),
                        repOverlap(clonesets_aa,.method="morisita",.col="aa")
                      )
      if (all(is.na(out_data))){
        out_data[1,] <- overlap_row
      } else {
        out_data<- rbind(out_data, overlap_row)
      }
    }
    
    overlap_meta_subset <- rbind(meta_data_o[meta_data_o$sample == cloneset_name_1, ],meta_data_o[meta_data_o$sample == cloneset_name_2, ])
    
    meta_out_row <- paste(currentVisGroup,currentOverlapGroups[i],currentOverlapGroups[i+1],sep='_')
    
    for (j in c(2:ncol(overlap_meta_subset))) {
      if (overlap_meta_subset[1,j]==overlap_meta_subset[2,j]) {
        meta_out_row <- append(meta_out_row,overlap_meta_subset[1,j])
      } else {
        meta_out_row <- append(meta_out_row,'')
      }
    }
    
    meta_out_row <- append(meta_out_row,currentOverlapGroups[i])
  
    out_meta[nrow(out_meta)+1,] <- meta_out_row
    
  }
  
}

if (length(unique(out_meta[,overlap_header_out])) < 2) {
  out_meta[overlap_header_out] <- NULL
}

out_data[out_data == 'NaN'] <- ''

write.table(
  out_data,
  file = paste(output_dir,'/overlap_data.csv',sep=""),
  quote = F,
  sep = ",",
  row.names = F,
  na = ""
)

write.table(
  out_meta,
  file = paste(output_dir,'/overlap_meta.csv',sep=""),
  quote = F,
  sep = ",",
  row.names = F,
  na = ""
)
