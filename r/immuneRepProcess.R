#!/usr/bin/env Rscript
args = commandArgs(trailingOnly=TRUE)

# CONFIG DEFAULTS 
sample_level_run = TRUE
cohort_level_run = TRUE
intracohort_run = TRUE
chains_search = c("TRB", "TRA", "TRG", "TRD", "IGH", "IGL", "IGK")
file_prefix = ""
file_suffix = ""
sumMax = 10
vjMax = 5
clonotypeMax = 8
clonotypeAbundance = NULL
custom_c = NULL
custom_d = NULL
report_dir = NULL
output_name = paste("Cohort", Sys.Date())

if (length(args)==0) {
  if(file.exists("config.R")){
    source("config.R")
  } else {
    stop("'Usage: Rscript static_figures.R config.R'", call.=FALSE)
  }
} else if (length(args)==1) {
  source(args[1])
} else {
  stop("'Usage: Rscript static_figures.R config.R'", call.=FALSE)
}

if (!(exists("input_format") & exists("input_dir") & exists("output_dir"))) {
  stop("'Define input_format, input_dir, and output_dir in config file'", call.=FALSE)
}

list.of.packages <- c("data.table", "ggplot2","tcR","RColorBrewer","scales")
new.packages <- list.of.packages[!(list.of.packages %in% installed.packages()[,"Package"])]
if(length(new.packages)) install.packages(new.packages)

suppressMessages(library(data.table))
suppressMessages(library(ggplot2))
suppressMessages(library(RColorBrewer))
suppressMessages(library(scales))
suppressMessages(library(tcR))

functionNum = 11
functionNum = functionNum + length(clonotypeAbundance)

intracohort_values_template <- data.frame(matrix(ncol = functionNum, nrow = 0))

intracohortColNames = c("sample", "chain", "CDR3 Length", "Raw Diversity", "Shannon Entropy Measure","1 / Shannon Entropy Measure", "Gini Coefficient","Gini-Simpson Index","Inverse Simpson Index","Chao1 Index","Unique CDR3 Count")

if (length(clonotypeAbundance)>0) {
  colnames(intracohort_values_template) <- c(intracohortColNames,paste(clonotypeAbundance, "(Freq*1000)", sep=" "))
} else {
  colnames(intracohort_values_template) <- intracohortColNames
}

if (input_format %in% c("TRUST4","CUSTOM")){
  if (!"Biostrings" %in% installed.packages()[,"Package"]){
    if (!requireNamespace("BiocManager", quietly = TRUE))
      install.packages("BiocManager")
    BiocManager::install("Biostrings")
  }
  suppressMessages(library(Biostrings))
}

input_dir = sub("/$","",input_dir)
output_dir = sub("/$","",output_dir)
if (!is.null(report_dir)) {
  report_dir = sub("/$","",report_dir)
}

files <-
  list.files(
    path = input_dir,
    pattern = paste("^",file_prefix,".*",file_suffix,"$",sep=""),
    full.names = F,
    recursive = F
  )

files <- gsub(paste("(",file_prefix,"|",file_suffix,"$)",sep=""),"", files)

dir.create(output_dir, showWarnings = FALSE)

if (sample_level_run == TRUE || intracohort_run == TRUE) {
  
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
      if (match(current_sample,files) == 1) {print(paste(Sys.time(),"Generating intracohort analysis table"))}
    }  
    
    print(paste(Sys.time(),"Sample",match(current_sample,files),"/",length(files),"-",current_sample))
    
    if (input_format == "TRUST4") {
      
      sample_table <-
        read.delim(paste(input_dir,"/",file_prefix,current_sample,file_suffix, sep = ""), header = F)
      
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
      }
      
      # remove partials
      sample_table <- sample_table[(sample_table$CDR3_score != 0.00), ]
      
      sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))
      
    } else if (input_format == "MIXCR") {
      
      sample_table <- read.delim(paste(input_dir,"/",file_prefix,current_sample,file_suffix, sep = ""), header = T)
      
      colnames(sample_table)[which(names(sample_table) == "allVHitsWithScore")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "allDHitsWithScore")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "allJHitsWithScore")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "allCHitsWithScore")] <- "C_gene"
      colnames(sample_table)[which(names(sample_table) == "nSeqCDR3")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "aaSeqCDR3")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "cloneCount")] <- "read_fragment_count"
      
    } else if (input_format == "ADAPTIVE") {
      
      sample_table <- read.delim(paste(input_dir,"/",file_prefix,current_sample,file_suffix, sep = ""), header = T)
      
      colnames(sample_table)[which(names(sample_table) == "v")] <- "V_gene"
      colnames(sample_table)[which(names(sample_table) == "d")] <- "D_gene"
      colnames(sample_table)[which(names(sample_table) == "j")] <- "J_gene"
      colnames(sample_table)[which(names(sample_table) == "cdr3nt")] <- "CDR3"
      colnames(sample_table)[which(names(sample_table) == "cdr3aa")] <- "CDR3_AA"
      colnames(sample_table)[which(names(sample_table) == "count")] <- "read_fragment_count"
      
    } else if (input_format == "CUSTOM") {
      
      sample_table <- read.delim(paste(input_dir,"/",file_prefix,current_sample,file_suffix, sep = ""), header = custom_header)     
      
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
      
      if (sample_level_run == TRUE) {
        sample_list <- append(sample_list,current_sample)
      }
      
      dir.create(paste(output_dir,current_sample,sep="/"), showWarnings = FALSE)
      
      if (input_format %in% c("MIXCR","TRUST4")){
        sample_table$V_gene <- sapply(strsplit(as.character(sample_table$V_gene), "[*]") , "[", 1)
        sample_table$J_gene <- sapply(strsplit(as.character(sample_table$J_gene), "[*]") , "[", 1)
        if (!is.null(sample_table$D_gene)) {
          sample_table$D_gene <- sapply(strsplit(as.character(sample_table$D_gene), "[*]") , "[", 1)
        }
        if (!is.null(sample_table$C_gene)) {
          sample_table$C_gene <- sapply(strsplit(as.character(sample_table$C_gene), "[*]") , "[", 1)
        }
      }
      
      for (current_chain in chains_search) {
        
        if (input_format == "ADAPTIVE"){
          which_chain <-
            t(apply(sample_table[c("V_gene", "D_gene", "J_gene")], 1, function(u)
              grepl(current_chain, u)))        
        } else if (input_format == "CUSTOM"){
          which_chain <-
            t(apply(sample_table[c("V_gene", "J_gene")], 1, function(u)
              grepl(current_chain, u)))               
        } else {
          which_chain <-
            t(apply(sample_table[c("V_gene", "J_gene", "C_gene")], 1, function(u)
              grepl(current_chain, u)))
        }
        
        chain_table_unprocessed <- sample_table[as.logical(rowSums(which_chain)),]
        
        chain_table_unprocessed_allframe <- chain_table_unprocessed
        chain_table_unprocessed <- chain_table_unprocessed[(data.frame(names = chain_table_unprocessed$CDR3,
                                                 chr = apply(chain_table_unprocessed, 2, nchar))$chr.CDR3 %% 3 == 0), ]
        
        count_sum = sum(chain_table_unprocessed$read_fragment_count)
        chain_table_unprocessed$read_fragment_freq <- sapply(chain_table_unprocessed$read_fragment_count/count_sum , "[", 1)
        
        if (dim(chain_table_unprocessed)[1] != 0) {
          
          if (sample_level_run == TRUE) {
            
            dir.create(paste(output_dir,current_sample,current_chain,sep="/"), showWarnings = FALSE)
            
            # cdr3ntlength
            
            chain_table <- chain_table_unprocessed_allframe
            
            if (nrow(chain_table)>1) {
              chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
            } else {
              chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
            }
            
            png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3ntLength.png',sep=""), width=1024,height=542)
            
            print(ggplot(chain_table) + geom_bar(aes(x=cdr3length, y=read_fragment_count), stat="identity",fill='#4483b6') + 
                    xlab('CDR3 Length, bp')+ylab('count') + scale_x_continuous(breaks= pretty_breaks()) +
                    theme_grey(base_size = 35))
            
            dev.off()
            
            rm(chain_table_unprocessed_allframe)
            
            # clonotype
            
            chain_table <- chain_table_unprocessed
            
            if (nrow(chain_table)>1) {
              chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
            } else {
              chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
            }
            
            chain_table <- aggregate(read_fragment_freq~CDR3_AA+cdr3length, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            chain_table$CDR3_AA <- as.character(chain_table$CDR3_AA)
            x <- as.character(chain_table$CDR3_AA) %in% c('*','')
            chain_table <- rbind(chain_table[!x,], chain_table[x,])
            if (nrow(chain_table) > clonotypeMax){
              chain_table[c((clonotypeMax+1):length(chain_table$CDR3_AA)),'CDR3_AA'] <- "Other"
            }
            
            for (i in c(1:pmin(nrow(chain_table),clonotypeMax))) {
              if (nchar(chain_table$CDR3_AA[i])>16){
                chain_table$CDR3_AA[i] <- sub( '(?<=.{14})', '...\n', chain_table$CDR3_AA[i], perl=TRUE )
              }
            }            
            
            chain_table$CDR3_AA <- factor(chain_table$CDR3_AA,levels=unique(chain_table$CDR3_AA))
            names(chain_table)[names(chain_table) == 'CDR3_AA'] <- 'Clonotype'
            
            png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3aaLength.png',sep=""), width=1024,height=542)
            
            print(ggplot(chain_table) + geom_bar(aes(x=cdr3length/3, y=read_fragment_freq,group=Clonotype,fill=Clonotype), stat="identity") + 
                    xlab('CDR3 length, AA') + scale_fill_brewer(palette="Spectral") +
                    ylab('frequency' ) + scale_x_continuous(breaks= pretty_breaks()) +
                    theme_grey(base_size = 35)) + theme(legend.title = element_text(size = 24), 
                                                        legend.text = element_text(size = 24),axis.title = element_text(size = 24), 
                                                        axis.text = element_text(size = 24))
            
            dev.off()
            
            # vsumbarplot
            
            chain_table <- chain_table_unprocessed
            
            chain_table <- aggregate(read_fragment_freq~V_gene, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            x <- as.character(chain_table$V_gene) %in% c('*','')
            chain_table <- chain_table[!x,]
            if (nrow(chain_table) > 0){
              sumV <- subset(unique(chain_table$V_gene)[c(1:sumMax)], (!is.na(unique(chain_table$V_gene)[c(1:sumMax)])))
              vjV <- subset(unique(chain_table$V_gene)[c(1:vjMax)], (!is.na(unique(chain_table$V_gene)[c(1:vjMax)])))
              chain_table <- chain_table[chain_table$V_gene %in% sumV, ]
              
              chain_table$V_gene <- factor(chain_table$V_gene)
              
              png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/vsumBarplot.png',sep=""), width=1024,height=542)
              
              print(ggplot(chain_table) + geom_bar(aes(x=reorder(V_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#e4744e') + 
                      xlab('Vgene')+ylab('frequency')+
                      theme_grey(base_size = 35)+ theme(axis.text.x = element_text(angle = 90, hjust = 1)))
              
              dev.off()
            }
            
            # jsumbarplot
            
            chain_table <- chain_table_unprocessed
            
            chain_table <- aggregate(read_fragment_freq~J_gene, chain_table, sum)
            
            chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
            
            x <- as.character(chain_table$J_gene) %in% c('*','')
            chain_table <- chain_table[!x,]
            if (nrow(chain_table) > 0){
              sumJ <- subset(unique(chain_table$J_gene)[c(1:sumMax)], (!is.na(unique(chain_table$J_gene)[c(1:sumMax)])))
              vjJ <- subset(unique(chain_table$J_gene)[c(1:vjMax)], (!is.na(unique(chain_table$J_gene)[c(1:vjMax)])))
              chain_table <- chain_table[chain_table$J_gene %in% sumJ, ]
              
              chain_table$J_gene <- factor(chain_table$J_gene)
              
              png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/jsumBarplot.png',sep=""), width=1024,height=542)
              
              print(ggplot(chain_table) + geom_bar(aes(x=reorder(J_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#7dc0a6') + 
                      xlab('Jgene')+ylab('frequency')+
                      theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
              
              dev.off()
            }
            
            if (current_chain == "IGH") {
              
              if (!is.null(chain_table_unprocessed$C_gene)) {
              
              # csumbarplot
              
              chain_table <- chain_table_unprocessed
              
              chain_table <- aggregate(read_fragment_freq~C_gene, chain_table, sum)
              
              chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
              
              x <- as.character(chain_table$C_gene) %in% c('*','')
              chain_table <- chain_table[!x,]
              if (nrow(chain_table) > 0){
                sumC <- subset(unique(chain_table$C_gene)[c(1:sumMax)], (!is.na(unique(chain_table$C_gene)[c(1:sumMax)])))
                chain_table <- chain_table[chain_table$C_gene %in% sumC, ]
                
                chain_table$C_gene <- factor(chain_table$C_gene)
                
                png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/csumBarplot.png',sep=""), width=1024,height=542)
                
                print(ggplot(chain_table) + geom_bar(aes(x=reorder(C_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#c54a52') + 
                        xlab('Cgene')+ylab('frequency')+
                        theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
                
                dev.off()
              }
              }
            }
            
            if (current_chain %in% c("IGH", "TRB", "TRD")) {
              
              if (!is.null(chain_table_unprocessed$D_gene)) {
              
              # dsumbarplot
              
              chain_table <- chain_table_unprocessed
              
              chain_table <- aggregate(read_fragment_freq~D_gene, chain_table, sum)
              
              chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
              
              x <- as.character(chain_table$D_gene) %in% c('*','','.')
              chain_table <- chain_table[!x,]
              if (nrow(chain_table) > 0){
                sumD <- subset(unique(chain_table$D_gene)[c(1:sumMax)], (!is.na(unique(chain_table$D_gene)[c(1:sumMax)])))
                chain_table <- chain_table[chain_table$D_gene %in% sumD, ]
                
                chain_table$D_gene <- factor(chain_table$D_gene)
                
                png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/dsumBarplot.png',sep=""), width=1024,height=542)
                
                print(ggplot(chain_table) + geom_bar(aes(x=reorder(D_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#4a87b8') + 
                        xlab('Dgene')+ylab('frequency')+
                        theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
                
                dev.off()
              }
              }
              
            }
            
            # vj
            
            chain_table <- chain_table_unprocessed
            
            png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/vjStackBar.png',sep=""), width=1024,height=542)
            
            x <- as.character(chain_table$J_gene) %in% c('*','')
            chain_table <- chain_table[!x,]
            
            x <- as.character(chain_table$V_gene) %in% c('*','')
            chain_table <- chain_table[!x,]
            
            if (nrow(chain_table) > 0){
              
              chain_table <- chain_table[chain_table$J_gene %in% vjJ, ]
              chain_table <- chain_table[chain_table$V_gene %in% vjV, ]
              
              names(chain_table)[names(chain_table) == 'J_gene'] <- 'Jgene'
              
              print(ggplot(chain_table) + geom_bar(aes(x=V_gene,y=read_fragment_freq,fill=Jgene), stat="identity") + 
                      xlab('Vgene')+ ylab(NULL) +
                      scale_fill_brewer(palette="Spectral") +
                      ylab('frequency') +
                      theme(axis.text.x = element_text(angle = 90, hjust = 1),legend.title = element_text(size = 18), 
                            legend.text = element_text(size = 18), axis.title = element_text(size = 18), 
                            axis.text = element_text(size = 18)))
              
              dev.off()  
            }
          }
          if (intracohort_run == TRUE) {
            intracohort_values <- intracohort_values_template
            
            chain_table_div <- chain_table_unprocessed
            
            chain_table_cdr3 <- chain_table_div[c("read_fragment_count", "CDR3")]
            if (nrow(chain_table_cdr3) != 1){
              chain_table_cdr3$CDR3 <-
                data.frame(names = chain_table_cdr3$CDR3,
                           chr = apply(chain_table_cdr3, 2, nchar))$chr.CDR3
            } else {
              chain_table_cdr3$CDR3 <- nchar(as.character(chain_table_cdr3$CDR3))
            }
            
            names(chain_table_div)[names(chain_table_div) == 'read_fragment_count'] <- 'Read.count'
            names(chain_table_div)[names(chain_table_div) == 'CDR3'] <- 'CDR3.nucleotide.sequence'
            names(chain_table_div)[names(chain_table_div) == 'V_gene'] <- 'J.gene'
            names(chain_table_div)[names(chain_table_div) == 'J_gene'] <- 'V.gene'
            
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
            intracohort_values[1, 1] <- current_sample
            intracohort_values[1, 2] <- current_chain
            if ((nrow(chain_table_cdr3) != 1) && (length(unique(chain_table_cdr3$CDR3)) != 1)){
              intracohort_values[1, 3] <- round(cdr3_aggregate/total_count,4)
            } else {
              intracohort_values[1, 3] <- chain_table_cdr3[1, 2]
            }
            suppressMessages(intracohort_values[1, 4] <- round(repDiversity(chain_table_div, "div", "read.count"),4))
            if (nrow(chain_table_cdr3) != 1){
            suppressMessages(intracohort_values[1, 5] <- round(repDiversity(chain_table_div, "entropy", "read.count"),4))
            suppressMessages(intracohort_values[1, 6] <- round(1/(repDiversity(chain_table_div, "entropy", "read.count")),4))
            suppressMessages(intracohort_values[1, 7] <- round(repDiversity(chain_table_div, "gini", "read.count"),4))
            suppressMessages(intracohort_values[1, 8] <- round(repDiversity(chain_table_div, "gini.simp", "read.count"),4))
            suppressMessages(intracohort_values[1, 9] <- round(repDiversity(chain_table_div, "inv.simp", "read.count"),4))
            suppressMessages(intracohort_values[1, 10] <- round(repDiversity(chain_table_div, "chao1", "read.count")[1],4))
            } 
            intracohort_values[1, 11] <- length(unique(chain_table_div$CDR3.nucleotide.sequence)) 
            
            if (length(clonotypeAbundance)>0){
              for (i in c(1:length(clonotypeAbundance))){
                foundClonotype = sum(chain_table_div[which(chain_table_div$CDR3_AA == clonotypeAbundance[i]), ]$read_fragment_freq)
                #foundClonotype = format(sum(chain_table_div[which(chain_table_div$CDR3_AA == clonotypeAbundance[i]), ]$Read.count), scientific = FALSE)
                if (foundClonotype != 0){
                 foundClonotype = foundClonotype * 1000
                }
                 #if (foundClonotype > 0){
                  intracohort_values[1, 11+i] <- foundClonotype
                #}
              }
            }
            
            if (exists("intracohort_table")) {
              intracohort_table <- rbind(intracohort_table, intracohort_values)
            } else {
              intracohort_table <- intracohort_values
            }
          }
        }
      }
    }
  }
}

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

if (sample_level_run == TRUE) {
  
  sample_list <- sample_list[order(nchar(sample_list), sample_list)]
  
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
  
  if (input_format == "TRUST4") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",file_prefix,x,file_suffix, sep = ""), header = F)
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
    }
    
    # remove partials
    sample_table <- sample_table[(sample_table$CDR3_score != 0.00), ]
    
    sample_table$CDR3_AA <- as.character(translate(DNAStringSet(sample_table$CDR3),if.fuzzy.codon="X"))
    
  } else if (input_format == "MIXCR") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",file_prefix,x,file_suffix, sep = ""), header = T)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[which(names(sample_table) == "allVHitsWithScore")] <- "V_gene"
    colnames(sample_table)[which(names(sample_table) == "allDHitsWithScore")] <- "D_gene"
    colnames(sample_table)[which(names(sample_table) == "allJHitsWithScore")] <- "J_gene"
    colnames(sample_table)[which(names(sample_table) == "allCHitsWithScore")] <- "C_gene"
    colnames(sample_table)[which(names(sample_table) == "nSeqCDR3")] <- "CDR3"
    colnames(sample_table)[which(names(sample_table) == "aaSeqCDR3")] <- "CDR3_AA"
    colnames(sample_table)[which(names(sample_table) == "cloneCount")] <- "read_fragment_count"
    
  } else if (input_format == "ADAPTIVE") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",file_prefix,x,file_suffix, sep = ""), header = T)
    })
    
    sample_table <- do.call(rbind,all_dfs)
    
    colnames(sample_table)[which(names(sample_table) == "v")] <- "V_gene"
    colnames(sample_table)[which(names(sample_table) == "d")] <- "D_gene"
    colnames(sample_table)[which(names(sample_table) == "j")] <- "J_gene"
    colnames(sample_table)[which(names(sample_table) == "cdr3nt")] <- "CDR3"
    colnames(sample_table)[which(names(sample_table) == "cdr3aa")] <- "CDR3_AA"
    colnames(sample_table)[which(names(sample_table) == "count")] <- "read_fragment_count"
    
  } else if (input_format == "CUSTOM") {
    
    all_dfs <- lapply(files, function(x){
      read.delim(paste(input_dir,"/",file_prefix,x,file_suffix, sep = ""), header = custom_header)
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
  
  if (input_format %in% c("MIXCR","TRUST4")){
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
  
  for (current_chain in chains_search) {
    
    if (input_format == "ADAPTIVE"){
      which_chain <-
        t(apply(sample_table[c("V_gene", "D_gene", "J_gene")], 1, function(u)
          grepl(current_chain, u)))        
    } else if (input_format == "CUSTOM"){
      which_chain <-
        t(apply(sample_table[c("V_gene", "J_gene")], 1, function(u)
          grepl(current_chain, u)))  
    } else {
      which_chain <-
        t(apply(sample_table[c("V_gene", "J_gene", "C_gene")], 1, function(u)
          grepl(current_chain, u)))
    }
    
    chain_table_unprocessed <- sample_table[as.logical(rowSums(which_chain)),]
    
    # in-frame only  
    chain_table_unprocessed_allframe <- chain_table_unprocessed
    chain_table_unprocessed <- chain_table_unprocessed[(data.frame(names = chain_table_unprocessed$CDR3,
                                             chr = apply(chain_table_unprocessed, 2, nchar))$chr.CDR3 %% 3 == 0), ]
    
    if (dim(chain_table_unprocessed)[1] != 0) {
      
      dir.create(paste(output_dir,current_sample,current_chain,sep="/"), showWarnings = FALSE)
      
      count_sum = sum(chain_table_unprocessed$read_fragment_count)
      chain_table_unprocessed$read_fragment_freq <- sapply(chain_table_unprocessed$read_fragment_count/count_sum , "[", 1)
      
      # cdr3ntlength
      
      chain_table <- chain_table_unprocessed_allframe
      
      if (nrow(chain_table)>1) {
        chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
      } else {
        chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
      }
      
      png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3ntLength.png',sep=""), width=1024,height=542)
      print(ggplot(chain_table) + geom_bar(aes(x=cdr3length, y=read_fragment_count), stat="identity",fill='#4483b6') + 
              xlab('CDR3 Length, bp') + ylab('count') + scale_x_continuous(breaks= pretty_breaks()) + 
              theme_grey(base_size = 35))
      
      dev.off()
      
      rm(chain_table_unprocessed_allframe)
      
      # clonotype
      
      chain_table <- chain_table_unprocessed
      
      if (nrow(chain_table)>1) {
        chain_table[,'cdr3length'] <- apply(chain_table,2,nchar)[,'CDR3']
      } else {
        chain_table[1,'cdr3length'] <- nchar(as.character(chain_table[1,'CDR3']))
      }
      
      chain_table <- aggregate(read_fragment_freq~CDR3_AA+cdr3length, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      chain_table$CDR3_AA <- as.character(chain_table$CDR3_AA)
      x <- as.character(chain_table$CDR3_AA) %in% c('*','')
      chain_table <- rbind(chain_table[!x,], chain_table[x,])
      if (nrow(chain_table) > clonotypeMax){
        chain_table[c((clonotypeMax+1):length(chain_table$CDR3_AA)),'CDR3_AA'] <- "Other"
      }
      
      for (i in c(1:pmin(nrow(chain_table),clonotypeMax))) {
        if (nchar(chain_table$CDR3_AA[i])>16){
          chain_table$CDR3_AA[i] <- sub( '(?<=.{14})', '...\n', chain_table$CDR3_AA[i], perl=TRUE )
        }
      } 
      
      chain_table$CDR3_AA <- factor(chain_table$CDR3_AA,levels=unique(chain_table$CDR3_AA))
      names(chain_table)[names(chain_table) == 'CDR3_AA'] <- 'Clonotype'
      
      png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/cdr3aaLength.png',sep=""), width=1024,height=542)
      
      print(ggplot(chain_table) + geom_bar(aes(x=cdr3length/3, y=read_fragment_freq,group=Clonotype,fill=Clonotype), stat="identity") + 
              xlab('CDR3 length, AA') + scale_fill_brewer(palette="Spectral") +
              ylab('frequency') + scale_x_continuous(breaks= pretty_breaks()) +
              theme_grey(base_size = 35)) + theme(legend.title = element_text(size = 24), 
                                                  legend.text = element_text(size = 24),axis.title = element_text(size = 24), 
                                                  axis.text = element_text(size = 24))
      
      dev.off()
      
      # vsumbarplot
      
      chain_table <- chain_table_unprocessed
      
      chain_table <- aggregate(read_fragment_freq~V_gene, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      x <- as.character(chain_table$V_gene) %in% c('*','')
      chain_table <- chain_table[!x,]
      if (nrow(chain_table) > 0){
        
        sumV <- subset(unique(chain_table$V_gene)[c(1:sumMax)], (!is.na(unique(chain_table$V_gene)[c(1:sumMax)])))
        vjV <- subset(unique(chain_table$V_gene)[c(1:vjMax)], (!is.na(unique(chain_table$V_gene)[c(1:vjMax)])))
        chain_table <- chain_table[chain_table$V_gene %in% sumV, ]
        
        chain_table$V_gene <- factor(chain_table$V_gene)
        
        png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/vsumBarplot.png',sep=""), width=1024,height=542)
        
        print(ggplot(chain_table) + geom_bar(aes(x=reorder(V_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#e4744e') + 
                xlab('Vgene')+ylab('frequency')+
                theme_grey(base_size = 35)+ theme(axis.text.x = element_text(angle = 90, hjust = 1)))
        
        dev.off()
      }
      
      # jsumbarplot
      
      chain_table <- chain_table_unprocessed
      
      chain_table <- aggregate(read_fragment_freq~J_gene, chain_table, sum)
      
      chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
      
      x <- as.character(chain_table$J_gene) %in% c('*','')
      chain_table <- chain_table[!x,]
      if (nrow(chain_table) > 0){
        sumJ <- subset(unique(chain_table$J_gene)[c(1:sumMax)], (!is.na(unique(chain_table$J_gene)[c(1:sumMax)])))
        vjJ <- subset(unique(chain_table$J_gene)[c(1:vjMax)], (!is.na(unique(chain_table$J_gene)[c(1:vjMax)])))
        chain_table <- chain_table[chain_table$J_gene %in% sumJ, ]
        
        chain_table$J_gene <- factor(chain_table$J_gene)
        
        png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/jsumBarplot.png',sep=""), width=1024,height=542)
        
        print(ggplot(chain_table) + geom_bar(aes(x=reorder(J_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#7dc0a6') + 
                xlab('Jgene')+ylab('frequency')+
                theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
        
        dev.off()
      }
      
      if (current_chain == "IGH") {
        
        if (!is.null(chain_table_unprocessed$C_gene)) {
        
        # csumbarplot
        
        chain_table <- chain_table_unprocessed
        
        chain_table <- aggregate(read_fragment_freq~C_gene, chain_table, sum)
        
        chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
        
        x <- as.character(chain_table$C_gene) %in% c('*','')
        chain_table <- chain_table[!x,]
        if (nrow(chain_table) > 0){
          sumC <- subset(unique(chain_table$C_gene)[c(1:sumMax)], (!is.na(unique(chain_table$C_gene)[c(1:sumMax)])))
          chain_table <- chain_table[chain_table$C_gene %in% sumC, ]
          
          chain_table$C_gene <- factor(chain_table$C_gene)
          
          png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/csumBarplot.png',sep=""), width=1024,height=542)
          
          print(ggplot(chain_table) + geom_bar(aes(x=reorder(C_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#c54a52') + 
                  xlab('Cgene')+ylab('frequency')+
                  theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
          
          dev.off()
        }
        
        }
      }
      
      if (current_chain %in% c("IGH", "TRB", "TRD")) {
        
        # dsumbarplot
        
        if (!is.null(chain_table_unprocessed$D_gene)) {
        
        chain_table <- chain_table_unprocessed
        
        chain_table <- aggregate(read_fragment_freq~D_gene, chain_table, sum)
        
        chain_table <- chain_table[order(-chain_table$read_fragment_freq),] 
        
        x <- as.character(chain_table$D_gene) %in% c('*','','.')
        chain_table <- chain_table[!x,]
        if (nrow(chain_table) > 0){
          sumD <- subset(unique(chain_table$D_gene)[c(1:sumMax)], (!is.na(unique(chain_table$D_gene)[c(1:sumMax)])))
          chain_table <- chain_table[chain_table$D_gene %in% sumD, ]
          
          chain_table$D_gene <- factor(chain_table$D_gene)
          
          png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/dsumBarplot.png',sep=""), width=1024,height=542)
          
          print(ggplot(chain_table) + geom_bar(aes(x=reorder(D_gene, -read_fragment_freq), y=read_fragment_freq), stat="identity",fill='#4a87b8') + 
                  xlab('Dgene')+ylab('frequency')+
                  theme_grey(base_size = 35)+theme(axis.text.x = element_text(angle = 90, hjust = 1)))
          
          dev.off()
        }
        
        }
        
      }
      
      # vj
      
      chain_table <- chain_table_unprocessed
      
      png(filename=paste(output_dir,'/',current_sample,'/',current_chain,'/vjStackBar.png',sep=""), width=1024,height=542)
      
      x <- as.character(chain_table$J_gene) %in% c('*','')
      chain_table <- chain_table[!x,]
      
      x <- as.character(chain_table$V_gene) %in% c('*','')
      chain_table <- chain_table[!x,]
      
      if (nrow(chain_table) > 0){
        
        chain_table <- chain_table[chain_table$J_gene %in% vjJ, ]
        chain_table <- chain_table[chain_table$V_gene %in% vjV, ]
        
        names(chain_table)[names(chain_table) == 'J_gene'] <- 'Jgene'
        
        print(ggplot(chain_table) + geom_bar(aes(x=V_gene,y=read_fragment_freq,fill=Jgene), stat="identity") + 
                xlab('Vgene')+ylab(NULL) +
                scale_fill_brewer(palette="Spectral") + 
                ylab('frequency') + 
                theme(axis.text.x = element_text(angle = 90, hjust = 1),legend.title = element_text(size = 18), 
                      legend.text = element_text(size = 18), axis.title = element_text(size = 18), 
                      axis.text = element_text(size = 18)))
        
        dev.off()  
      }
    }
  }
}

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
