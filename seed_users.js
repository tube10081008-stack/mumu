import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Manually load env since we are running via node
const supabaseUrl = 'https://yhppbbhaoauddeaaypgu.supabase.co';
const supabaseKey = 'sb_publishable_kY9w_lS_cv9rHDn_nloYpQ_4yqN0SRt';

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    { email: 'admin@mumu.com', password: 'password0000', name: '관리자', role: 'admin' },
    { email: 'driver-a@mumu.com', password: 'password1234', name: '홍기사', role: 'driver' },
    { email: 'driver-b@mumu.com', password: 'password5678', name: '김기사', role: 'driver' }
];

async function seed() {
    console.log("🌱 유저 생성 시작...");

    for (const user of users) {
        console.log(`Creating ${user.name} (${user.email})...`);

        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    name: user.name,
                    role: user.role
                }
            }
        });

        if (error) {
            console.error(`❌ 실패: ${error.message}`);
        } else {
            console.log(`✅ 성공! (ID: ${data.user?.id})`);
            if (data.session) {
                console.log("   -> 자동 로그인 성공 (이메일 인증 불필요)");
            } else {
                console.log("   -> ⚠️ 이메일 인증이 필요할 수 있습니다. Supabase 대시보드에서 유저를 확인하세요.");
            }
        }
    }
}

seed();
