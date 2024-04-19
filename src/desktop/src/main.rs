// Original license: https://github.com/tauri-apps/wry/tree/9041f9b10668fb0b933e87aa94716f9f008ce8c5
// Copyright 2020-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use gdk::ffi::{
    gdk_display_get_default, gdk_display_get_primary_monitor, gdk_monitor_get_workarea,
    GdkRectangle,
};
use gtk::prelude::{GtkWindowExt, WidgetExt};
use std::process::Command;
use tao::{
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder, EventLoopWindowTarget},
    platform::unix::WindowExtUnix,
    window::{Window, WindowBuilder},
};
use wry::{WebView, WebViewBuilder};

const HIDE_IF_NOT_RUNNING: bool = false;

enum UserEvent {}

fn main() -> wry::Result<()> {
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let main_window = create_new_window(format!("Marvel Snap Tracker"), &event_loop);

    event_loop.run(move |event, _event_loop, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                window_id,
                ..
            } => {
                if window_id == main_window.0.id() {
                    *control_flow = ControlFlow::Exit;
                }
            }
            _ => {
                if !HIDE_IF_NOT_RUNNING {
                    return;
                }

                if main_window.0.is_visible() {
                    if !is_marvel_snap_running() {
                        let gtk_window = main_window.0.gtk_window();
                        println!("Marvel Snap is not running, closing overlay");
                        gtk_window.hide();
                    }
                } else {
                    if is_marvel_snap_running() {
                        let gtk_window = main_window.0.gtk_window();
                        println!("Marvel Snap is running, opening overlay");
                        gtk_window.show();
                        position_gtk_window(&gtk_window);
                    }
                }
            }
        }
    });
}

fn exec(cmd: &str, args: &[&str]) -> String {
    let output = Command::new(cmd)
        .args(args)
        .output()
        .expect("failed to execute cmd");

    String::from_utf8(output.stdout).unwrap()
}

fn position_gtk_window(gtk_window: &gtk::ApplicationWindow) {
    unsafe {
        // Move window to right center of the screen
        let mut workarea = GdkRectangle {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };
        gdk_monitor_get_workarea(
            gdk_display_get_primary_monitor(gdk_display_get_default()),
            &mut workarea,
        );
        gtk_window.move_(workarea.width - 560, workarea.height / 2 - 500 / 2);
    };
}

fn is_marvel_snap_running() -> bool {
    let output = exec("sh", &["-c", "ps aux | grep 'SNAP.exe' | grep -v grep"]);
    return output.len() > 0;
}

fn create_new_window(
    title: String,
    event_loop: &EventLoopWindowTarget<UserEvent>,
) -> (Window, WebView) {
    let window = WindowBuilder::new()
        .with_title(title)
        .build(event_loop)
        .unwrap();

    #[cfg(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "ios",
        target_os = "android"
    ))]
    let builder = WebViewBuilder::new(&window);

    #[cfg(not(any(
        target_os = "windows",
        target_os = "macos",
        target_os = "ios",
        target_os = "android"
    )))]
    let builder = {
        use wry::WebViewBuilderExtUnix;
        let vbox = window.default_vbox().unwrap();
        WebViewBuilder::new_gtk(vbox)
    };

    let gtk_window = window.gtk_window();

    let gdk_window = gtk_window.window().unwrap();
    gdk_window.set_override_redirect(true);
    gdk_window.set_accept_focus(false);
    gdk_window.set_keep_above(true);
    gdk_window.set_type_hint(gdk::WindowTypeHint::Dialog);
    gdk_window.hide();

    let webview = builder
        .with_url("http://localhost:1420")
        .build()
        .unwrap();

    gdk_window.show();
    position_gtk_window(&gtk_window);
    // let display_count = gdk::Screen::default().unwrap().display().n_monitors();
    gdk_window.resize(570, 320);

    if is_marvel_snap_running() {
        println!("Marvel Snap is running, opening overlay");
        gdk_window.show();
    }

    (window, webview)
}
