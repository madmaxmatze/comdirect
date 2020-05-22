<?php

// https://evertpot.com/107/

// Our class
class FileCache {
  private $cacheDir;

  public function __construct($cacheDir) {
    $this->cacheDir = $cacheDir;
  }

  // This is the function you store information with
  public function put($key, $data, $ttl = null) {

    // Opening the file
    $h = fopen($this->getFileName($key), 'w');
    if (!$h) throw new Exception('Could not write to cache');
    // Serializing along with the TTL
    $expireTime = 0;
    if ($ttl) {
        $expireTime = time() + $ttl;
    } 
    $data = json_encode(array($expireTime, $data));
    if (fwrite($h, $data)===false) {
      throw new Exception('Could not write to cache');
    }
    fclose($h);

  }

  // The function to fetch data returns false on failure
  public function get($key) {
      $txtFilename = $this->getFileName($key, "txt");
  
      // json
      $jsonFilename = $this->getFileName($key);
      if (file_exists($jsonFilename) && is_readable($jsonFilename)) {
        $fileContent = file_get_contents($jsonFilename);
        $data = @json_decode($fileContent, true);
      }

      // txt
      if (!$data) {
        if (file_exists($txtFilename) && is_readable($txtFilename)) {
          $fileContent = file_get_contents($txtFilename);
          $data = @unserialize($fileContent);
        }
        if (!$data) {
          // Unlinking the file when unserializing failed
          @unlink($txtFilename);
          return false;
        }
      }

      // checking if the data was expired
      if ($data[0] && time() > $data[0]) {
         @unlink($jsonFilename);
         @unlink($txtFilename);
         return false;
      }

      return ($data ? $data[1] : false);
    }


  // General function to find the filename for a certain key
  private function getFileName($key, $extension = "json") {      
    $keyFilename = preg_replace('/[^A-Za-z0-9-_]/', '', $key);
    $fileName = $this->cacheDir . '/' . $keyFilename . "_" . md5($key) . "." . $extension;
    return $fileName;
  }
}
