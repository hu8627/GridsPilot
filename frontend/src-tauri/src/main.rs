#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 引入 Tauri 2.0 的 Shell 插件扩展
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

fn main() {
    tauri::Builder::default()
        // 1. 注册 shell 插件
        .plugin(tauri_plugin_shell::init())
        // 2. 在 setup 钩子中静默拉起 Python 引擎
        .setup(|app| {
            println!("🚀 NexaFlow OS 桌面端启动中...");
            
            // 获取我们在 tauri.conf.json 里配置好的 externalBin
            let sidecar_command = app.shell().sidecar("nexaflow-engine").unwrap();
            
            // 唤醒引擎！(_child 会被 Tauri 自动管理生命周期，关 App 时自动杀进程)
            let (mut rx, _child) = sidecar_command
                .spawn()
                .expect("⚠️ 唤醒 Python 引擎失败！请检查 bin 目录下是否有 nexaflow-engine 且赋予了执行权限");

            // 开启异步线程，把 Python 的打印信息输出到 Rust 终端
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line) = event {
                        println!("🐍 [Python Engine]: {}", String::from_utf8_lossy(&line));
                    } else if let CommandEvent::Stderr(line) = event {
                        eprintln!("🐍 [Python Error]: {}", String::from_utf8_lossy(&line));
                    }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}