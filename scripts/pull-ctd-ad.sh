set -e
cd /tmp
URL="https://ctdbase.org/reports/CTD_chemicals_diseases.csv.gz"
echo "downloading CTD chemicals-diseases (this is large)..."
curl -sL --max-time 480 -o /tmp/ctd_cd.csv.gz "$URL"
echo "downloaded: $(ls -la /tmp/ctd_cd.csv.gz | awk '{print $5}') bytes"
# CTD CSV: ChemicalName,ChemicalID,CasRN,DiseaseName,DiseaseID,DirectEvidence,InferenceGeneSymbol,InferenceScore,OmimIDs,PubMedIDs
# Keep only AD (MESH:D000544) rows WITH DirectEvidence (marker/mechanism or therapeutic)
zcat /tmp/ctd_cd.csv.gz | awk -F',' '$5=="MESH:D000544" && $6!="" {print $1"|"$3"|"$6}' > /tmp/ctd_ad_directevidence.tsv
echo "AD DirectEvidence rows: $(wc -l < /tmp/ctd_ad_directevidence.tsv)"
echo "--- sample (marker/mechanism only) ---"
grep 'marker/mechanism' /tmp/ctd_ad_directevidence.tsv | head -40
