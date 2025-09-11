const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

// Restore database script
const restoreDatabase = async () => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    const dbPath = path.join(__dirname, '..', 'kasir.db');

    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      console.log('❌ Direktori backup tidak ditemukan');
      return;
    }

    // Get list of backup files
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('kasir_backup_') && file.endsWith('.db'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      console.log('❌ Tidak ada file backup ditemukan');
      return;
    }

    console.log('📋 File backup yang tersedia:');
    backupFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n🔢 Pilih nomor file backup yang akan direstore (atau 0 untuk batal): ', (answer) => {
      const choice = parseInt(answer);
      
      if (choice === 0) {
        console.log('❌ Restore dibatalkan');
        rl.close();
        return;
      }

      if (choice < 1 || choice > backupFiles.length) {
        console.log('❌ Pilihan tidak valid');
        rl.close();
        return;
      }

      const selectedBackup = backupFiles[choice - 1];
      const backupPath = path.join(backupDir, selectedBackup);

      rl.question(`\n⚠️  Apakah Anda yakin ingin restore dari ${selectedBackup}? Database saat ini akan ditimpa! (y/N): `, (confirm) => {
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          try {
            // Backup current database before restore
            if (fs.existsSync(dbPath)) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const currentBackupPath = path.join(backupDir, `kasir_before_restore_${timestamp}.db`);
              fs.copySync(dbPath, currentBackupPath);
              console.log(`💾 Database saat ini dibackup ke: kasir_before_restore_${timestamp}.db`);
            }

            // Restore from backup
            fs.copySync(backupPath, dbPath);
            console.log(`✅ Database berhasil direstore dari: ${selectedBackup}`);
            
          } catch (error) {
            console.error('❌ Error during restore:', error.message);
          }
        } else {
          console.log('❌ Restore dibatalkan');
        }
        
        rl.close();
      });
    });

  } catch (error) {
    console.error('❌ Error during restore:', error.message);
  }
};

// Run restore if called directly
if (require.main === module) {
  restoreDatabase();
}

module.exports = { restoreDatabase }; 