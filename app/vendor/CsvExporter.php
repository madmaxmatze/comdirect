<?php

// https://stackoverflow.com/questions/4249432/export-to-csv-via-php/13474770#13474770
class CsvExporter {
  public function __construct($filename, $data) {
    // $this->download_send_headers($filename);
    $data = $this->prepDataForExport($data);
    echo $this->array2csv($data);
    die();
  }
  
  private function prepDataForExport(array $data) {
    // list of all keys of all rows
    $allKeys = array_unique(array_reduce($data, function ($carry, $item) {
      return array_merge($carry, array_keys($item));
    }, []));
    
    foreach ($data as &$row) {
      // add missing fields
      $missingKeys = array_diff($allKeys, array_keys($row));
      if (count($missingKeys)) {
        $missingKeys = array_fill_keys(array_values($missingKeys), null);
        $row = array_merge($row, $missingKeys);
      }
      
      // &amp; => &
      foreach ($row as &$value) {
        if (gettype($value) == "string") {
          $value = html_entity_decode($value);
        }
      }

      // sort keys in each row
      uksort($row, function($key1, $key2) use ($allKeys) {
        return ((array_search($key1, $allKeys) > array_search($key2, $allKeys)) ? 1 : -1);
      });
    }

    return $data;
  }

  private function array2csv(array &$array) {
    if (count($array) == 0) {
      return null;
    }

    $df = fopen("php://memory", 'w');
    fputcsv($df, array_keys(reset($array)));
    foreach ($array as $row) {
      if (isset($row["count"])) {
        fputcsv($df, $row);
      }
    }
    rewind($df);
    // fclose($df);  
    
    return stream_get_contents($df);
  }

  private function download_send_headers($filename) {
    // disable caching
    $now = gmdate("D, d M Y H:i:s");
    header("Expires: Tue, 03 Jul 2001 06:00:00 GMT");
    header("Cache-Control: max-age=0, no-cache, must-revalidate, proxy-revalidate");
    header("Last-Modified: {$now} GMT");

    // force download  
    header("Content-Type: application/force-download");
    header("Content-Type: application/octet-stream");
    header("Content-Type: application/download");

    // disposition / encoding on response body
    header("Content-Disposition: attachment;filename={$filename}");
    header("Content-Transfer-Encoding: binary");
  }
}