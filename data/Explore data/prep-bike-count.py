import pandas as pd

# Load the CSV files into DataFrames
file_path_counts = 'data/raw/bike-counts.csv'
bike_counts_df = pd.read_csv(file_path_counts)

file_path_locations = 'data/raw/bike-counts-locations.csv'
bike_counts_locations_df = pd.read_csv(file_path_locations)

# Merge the DataFrames on the common column (e.g., 'id_compteur' in bike_counts_df and 'ID' in bike_counts_locations_df)
merged_df = pd.merge(bike_counts_df, bike_counts_locations_df, left_on='id_compteur', right_on='ID')

# Group by the location and get the total count per location, including Latitude and Longitude
total_counts_per_location = merged_df.groupby(['Nom', 'Latitude', 'Longitude'])['nb_passages'].sum().reset_index()

# write curated data to csv
def write_curated_data():
    total_counts_per_location.to_csv('data/curated/bike-counts-per-location.csv', index=False)

write_curated_data()